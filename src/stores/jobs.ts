import { create } from "zustand";
import type { Job } from "@/types/jobs";

interface JobsState {
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
}

export const useJobsStore = create<JobsState>()(set => ({
  jobs: [],
  setJobs: (jobs: Job[]) => set({ jobs }),
  addJob: (job: Job) => set(state => ({ jobs: [job, ...state.jobs] })),
  updateJob: (jobId: string, updates: Partial<Job>) =>
    set(state => ({
      jobs: state.jobs.map(job =>
        job.id === jobId ? { ...job, ...updates } : job
      ),
    })),
}));
