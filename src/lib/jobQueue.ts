import { logger } from "@/lib/logger";

type JobStatus = "pending" | "running" | "completed" | "failed";

interface Job<T = unknown> {
  id: string;
  name: string;
  status: JobStatus;
  handler: () => Promise<T>;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: T;
  error?: Error;
  retries: number;
  maxRetries: number;
}

class JobQueue {
  private queue: Job[] = [];
  private running = 0;
  private maxConcurrency: number;
  private jobCounter = 0;

  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency;
  }

  enqueue<T>(
    name: string,
    handler: () => Promise<T>,
    options?: { maxRetries?: number }
  ): string {
    const id = `job-${++this.jobCounter}-${Date.now()}`;
    this.queue.push({
      id,
      name,
      status: "pending",
      handler: handler as () => Promise<unknown>,
      createdAt: Date.now(),
      retries: 0,
      maxRetries: options?.maxRetries ?? 2,
    });

    logger.debug(`Job enqueued: ${name}`, {
      context: "JOB_QUEUE",
      data: { jobId: id, queueLength: this.queue.length },
    });

    this.processNext();
    return id;
  }

  getStatus(jobId: string): Job | undefined {
    return this.queue.find((j) => j.id === jobId);
  }

  getStats(): {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    total: number;
  } {
    return {
      pending: this.queue.filter((j) => j.status === "pending").length,
      running: this.queue.filter((j) => j.status === "running").length,
      completed: this.queue.filter((j) => j.status === "completed").length,
      failed: this.queue.filter((j) => j.status === "failed").length,
      total: this.queue.length,
    };
  }

  private async processNext(): Promise<void> {
    if (this.running >= this.maxConcurrency) return;

    const job = this.queue.find((j) => j.status === "pending");
    if (!job) return;

    this.running++;
    job.status = "running";
    job.startedAt = Date.now();

    logger.info(`Job started: ${job.name}`, {
      context: "JOB_QUEUE",
      data: { jobId: job.id },
    });

    try {
      const result = await job.handler();
      job.status = "completed";
      job.result = result;
      job.completedAt = Date.now();

      const duration = job.completedAt - job.startedAt;
      logger.info(`Job completed: ${job.name}`, {
        context: "JOB_QUEUE",
        data: { jobId: job.id, duration },
      });
    } catch (error) {
      job.error = error instanceof Error ? error : new Error(String(error));

      if (job.retries < job.maxRetries) {
        job.retries++;
        job.status = "pending";
        logger.warn(`Job retry ${job.retries}/${job.maxRetries}: ${job.name}`, {
          context: "JOB_QUEUE",
          data: { jobId: job.id },
        });
      } else {
        job.status = "failed";
        job.completedAt = Date.now();
        logger.error(`Job failed: ${job.name}`, {
          context: "JOB_QUEUE",
          error: job.error,
          data: { jobId: job.id, retries: job.retries },
        });
      }
    } finally {
      this.running--;
      this.processNext();
    }
  }
}

export const jobQueue = new JobQueue(3);

export function enqueueProfilingJob(
  handler: () => Promise<void>,
  datasetName: string
): string {
  return jobQueue.enqueue(`profile:${datasetName}`, handler, {
    maxRetries: 1,
  });
}

export function enqueueReportJob(
  handler: () => Promise<void>,
  datasetName: string,
  format: string
): string {
  return jobQueue.enqueue(`report:${datasetName}:${format}`, handler, {
    maxRetries: 1,
  });
}
