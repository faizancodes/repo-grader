import type { Job } from "@/types/jobs";
import { Logger } from "./logger";
import { redis } from "./redis";

const logger = new Logger("KVStorage");
const KV_PREFIX = "analysis-job:";
const USER_INDEX_PREFIX = "user-jobs:";

export class KVStorage {
  static isValidJob(job: unknown): job is Job {
    if (!job || typeof job !== "object") return false;

    const j = job as Partial<Job>;
    return Boolean(
      j.id &&
        typeof j.id === "string" &&
        j.userId &&
        typeof j.userId === "string" &&
        j.url &&
        typeof j.url === "string" &&
        j.status &&
        typeof j.status === "string" &&
        j.createdAt &&
        typeof j.createdAt === "string" &&
        j.updatedAt &&
        typeof j.updatedAt === "string"
    );
  }

  static async createJob(url: string, userId: string): Promise<Job> {
    logger.info("Creating new analysis job", { url, userId });

    const job: Job = {
      id: crypto.randomUUID(),
      userId,
      status: "pending",
      url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Validate job data before storing
    if (!KVStorage.isValidJob(job)) {
      logger.error("Invalid job data structure", { job });
      throw new Error("Failed to create job: Invalid data structure");
    }

    logger.debug("Generated new job details", {
      jobId: job.id,
      userId: job.userId,
      status: job.status,
      createdAt: job.createdAt,
    });

    const jobKey = `${KV_PREFIX}${job.id}`;
    const userKey = `${USER_INDEX_PREFIX}${userId}`;

    try {
      // Store job
      await redis.set(jobKey, job);
      // Add job ID to user's job list
      await redis.sadd(userKey, job.id);

      // Verify the job was stored correctly
      const storedJob = await redis.get<unknown>(jobKey);
      const parsedJob = this.parseJobData(storedJob);

      if (!parsedJob) {
        logger.error("Job verification failed", {
          original: job,
          stored: storedJob,
        });
        throw new Error("Failed to verify stored job");
      }

      logger.info("Successfully created and verified job", {
        jobId: job.id,
        userId: job.userId,
        url: job.url,
        status: job.status,
      });
      return job;
    } catch (error) {
      logger.error("Failed to create job", {
        error: error instanceof Error ? error.message : String(error),
        job,
      });
      throw error;
    }
  }

  static async getJob(jobId: string): Promise<Job | null> {
    logger.info("Fetching job details", { jobId });

    try {
      const key = `${KV_PREFIX}${jobId}`;
      const rawJob = await redis.get<unknown>(key);

      if (!rawJob) {
        logger.warn("Job not found", { jobId });
        return null;
      }

      const job = this.parseJobData(rawJob);
      if (!job) {
        logger.warn("Invalid job data format", { jobId, rawJob });
        return null;
      }

      logger.debug("Retrieved job details", {
        jobId,
        userId: job.userId,
        status: job.status,
        updatedAt: job.updatedAt,
      });

      return job;
    } catch (error) {
      logger.error("Failed to get job", {
        jobId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  static async updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
    logger.info("Updating job", { jobId, updates });

    const existingJob = await this.getJob(jobId);
    if (!existingJob) {
      logger.error("Failed to update - job not found", { jobId });
      throw new Error(`Job ${jobId} not found`);
    }

    const updatedJob: Job = {
      ...existingJob,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Validate the updated job
    if (!KVStorage.isValidJob(updatedJob)) {
      logger.error("Invalid updated job data structure", { updatedJob });
      throw new Error("Failed to update job: Invalid data structure");
    }

    const key = `${KV_PREFIX}${jobId}`;
    try {
      // Store job directly, no extra wrapping
      await redis.set(key, updatedJob);

      // Verify the update
      const storedJob = await redis.get<unknown>(key);
      const parsedJob = this.parseJobData(storedJob);

      if (!parsedJob) {
        logger.error("Job update verification failed", {
          original: updatedJob,
          stored: storedJob,
        });
        throw new Error("Failed to verify updated job");
      }

      logger.info("Successfully updated job", {
        jobId,
        updates,
        currentStatus: updatedJob.status,
        updatedAt: updatedJob.updatedAt,
      });

      return updatedJob;
    } catch (error) {
      logger.error("Failed to update job", {
        error: error instanceof Error ? error.message : String(error),
        jobId,
        updates,
      });
      throw error;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      logger.info("Testing Redis connection");
      const result = await redis.ping();
      logger.info("Redis connection test successful", { result });
      return result === "PONG";
    } catch (error) {
      logger.error("Redis connection test failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  static parseJobData(data: unknown): Job | null {
    try {
      // If it's a string, try to parse it
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          logger.warn("Failed to parse job string data", { data });
          return null;
        }
      }

      // If it has a 'value' property that's a string, parse that
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (data as any)?.value === "string") {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data = JSON.parse((data as any).value);
        } catch {
          logger.warn("Failed to parse job value data", { data });
          return null;
        }
      }

      // If it has a 'result' property that's a string, parse that
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (data as any)?.result === "string") {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data = JSON.parse((data as any).result);
        } catch {
          logger.warn("Failed to parse job result data", { data });
          return null;
        }
      }

      // Now validate the final data structure
      if (KVStorage.isValidJob(data)) {
        return data as Job;
      }

      logger.warn("Data failed job validation after parsing", { data });
      return null;
    } catch (error) {
      logger.error("Error parsing job data", {
        error: error instanceof Error ? error.message : String(error),
        data,
      });
      return null;
    }
  }

  static async listJobs(): Promise<Job[]> {
    // First test the connection
    const isConnected = await this.testConnection();
    if (!isConnected) {
      logger.error("Cannot list jobs - Redis connection failed");
      return [];
    }

    logger.info("Listing all analysis jobs");

    try {
      let cursor = 0;
      const allKeys: string[] = [];

      do {
        logger.info("Making scan request", { cursor, prefix: KV_PREFIX });
        // Use Redis SCAN command
        const [newCursor, keys] = await redis.scan(cursor, {
          match: `${KV_PREFIX}*`,
          count: 50,
        });

        logger.info("Scan request result", {
          newCursor,
          keysCount: keys.length,
          keys,
        });
        allKeys.push(...keys);
        cursor =
          typeof newCursor === "string" ? parseInt(newCursor, 10) : newCursor;
      } while (cursor !== 0);

      if (allKeys.length === 0) {
        logger.info("No jobs found");
        return [];
      }

      logger.info(`Found ${allKeys.length} keys, fetching job data`);

      // Fetch all jobs in parallel using Redis mget with proper typing
      const rawJobs = await redis.mget<unknown[]>(...allKeys);
      logger.info("Raw jobs data:", { rawJobs });

      const validJobs = rawJobs
        .map(data => this.parseJobData(data))
        .filter((job): job is Job => job !== null)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      logger.info(`Successfully retrieved ${validJobs.length} valid jobs`, {
        validJobs,
        firstJob: validJobs[0],
        lastJob: validJobs[validJobs.length - 1],
      });
      return validJobs;
    } catch (error) {
      logger.error("Failed to list jobs", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return [];
    }
  }

  static async listJobsForUser(userId: string): Promise<Job[]> {
    // First test the connection
    const isConnected = await this.testConnection();
    if (!isConnected) {
      logger.error("Cannot list jobs - Redis connection failed");
      return [];
    }

    logger.info("Listing analysis jobs for user", { userId });

    try {
      const userKey = `${USER_INDEX_PREFIX}${userId}`;
      // Get all job IDs for this user
      const jobIds = await redis.smembers(userKey);

      if (jobIds.length === 0) {
        logger.info("No jobs found for user", { userId });
        return [];
      }

      logger.info(`Found ${jobIds.length} jobs for user, fetching details`, {
        userId,
        jobIds,
      });

      // Construct keys for all jobs
      const jobKeys = jobIds.map(id => `${KV_PREFIX}${id}`);

      // Fetch all jobs in parallel
      const rawJobs = await redis.mget<unknown[]>(...jobKeys);
      logger.info("Raw jobs data:", { rawJobs });

      const validJobs = rawJobs
        .map(data => this.parseJobData(data))
        .filter((job): job is Job => job !== null && job.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      logger.info(
        `Successfully retrieved ${validJobs.length} valid jobs for user`,
        {
          userId,
          validJobs,
          firstJob: validJobs[0],
          lastJob: validJobs[validJobs.length - 1],
        }
      );

      return validJobs;
    } catch (error) {
      logger.error("Failed to list jobs for user", {
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return [];
    }
  }
}
