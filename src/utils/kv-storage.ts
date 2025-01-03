import { env } from "@/config/env";
import type { Job } from "@/types/jobs";
import { Logger } from "./logger";

const logger = new Logger("KVStorage");
const KV_PREFIX = "analysis-job:";

export class KVStorage {
  private static async fetch(endpoint: string, options: RequestInit = {}) {
    logger.info("Making KV storage request", {
      endpoint,
      method: options.method,
    });

    if (!env.KV_REST_API_URL || !env.KV_REST_API_TOKEN) {
      logger.error("KV storage not configured", {
        hasUrl: !!env.KV_REST_API_URL,
        hasToken: !!env.KV_REST_API_TOKEN,
      });
      throw new Error("KV storage not configured");
    }

    const url = `${env.KV_REST_API_URL}${endpoint}`;
    logger.debug("Constructed KV storage URL", { url });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${env.KV_REST_API_TOKEN}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      logger.debug("KV storage response received", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      if (!response.ok) {
        logger.error("KV storage request failed", {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          method: options.method,
        });
        throw new Error(`KV storage request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      logger.error("KV storage request threw error", {
        error: error instanceof Error ? error.message : String(error),
        endpoint,
        method: options.method,
      });
      throw error;
    }
  }

  static async createJob(url: string): Promise<Job> {
    logger.info("Creating new analysis job", { url });

    const job: Job = {
      id: crypto.randomUUID(),
      status: "pending",
      url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logger.debug("Generated new job details", {
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
    });

    const key = `${KV_PREFIX}${job.id}`;
    await this.fetch(`/set/${key}`, {
      method: "POST",
      body: JSON.stringify({ value: JSON.stringify(job) }),
    });

    logger.info("Successfully created job", {
      jobId: job.id,
      url: job.url,
      status: job.status,
    });
    return job;
  }

  static async getJob(jobId: string): Promise<Job | null> {
    logger.info("Fetching job details", { jobId });

    try {
      const key = `${KV_PREFIX}${jobId}`;
      const result = await this.fetch(`/get/${key}`);

      if (!result) {
        logger.warn("Job not found", { jobId });
        return null;
      }

      const parsed = JSON.parse(result);
      const job = parsed.value ? JSON.parse(parsed.value) : null;

      if (!job) {
        logger.warn("Invalid job data format", { jobId, result });
        return null;
      }

      logger.debug("Retrieved job details", {
        jobId,
        status: job.status,
        updatedAt: job.updatedAt,
      });

      return job as Job;
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

    const job = await this.getJob(jobId);
    if (!job) {
      logger.error("Failed to update - job not found", { jobId });
      throw new Error(`Job ${jobId} not found`);
    }

    const updatedJob: Job = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const key = `${KV_PREFIX}${jobId}`;
    await this.fetch(`/set/${key}`, {
      method: "POST",
      body: JSON.stringify({ value: JSON.stringify(updatedJob) }),
    });

    logger.info("Successfully updated job", {
      jobId,
      updates,
      currentStatus: updatedJob.status,
      updatedAt: updatedJob.updatedAt,
    });

    return updatedJob;
  }
}
