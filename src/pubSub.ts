import Redis from "ioredis";
import { Logger } from "winston";

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  tls?: boolean;
  connectTimeout?: number;
  maxRetriesPerRequest?: number;
}

export class Publisher {
  private publisher: Redis;
  private logger: Logger;

  constructor(config: RedisConfig, logger: Logger) {
    this.publisher = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      tls: config.tls ? {} : undefined,
      connectTimeout: config.connectTimeout || 10000,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
    
    this.logger = logger;
    
    this.publisher.on("error", (err) => {
      this.logger.error("Redis publisher error:", err);
    });
    
    this.publisher.on("connect", () => {
      this.logger.info("Redis publisher connected");
    });
  }

  publish(channel: string, message: any): Promise<number> {
    try {
      const messageString = JSON.stringify(message);
      return this.publisher.publish(channel, messageString);
    } catch (error) {
      this.logger.error("Error publishing message:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.publisher.quit();
    this.logger.info("Redis publisher disconnected");
  }
}

export class Subscriber {
  private subscriber: Redis;
  private logger: Logger;
  private handlers: Map<string, Array<(channel: string, message: any) => void>> = new Map();

  constructor(config: RedisConfig, logger: Logger) {
    this.subscriber = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      tls: config.tls ? {} : undefined,
      connectTimeout: config.connectTimeout || 10000,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
    
    this.logger = logger;
    
    this.subscriber.on("error", (err) => {
      this.logger.error("Redis subscriber error:", err);
    });
    
    this.subscriber.on("connect", () => {
      this.logger.info("Redis subscriber connected");
    });
    
    this.subscriber.on("message", (channel: string, message: string) => {
      try {
        const parsedMessage = JSON.parse(message);
        const handlers = this.handlers.get(channel) || [];
        handlers.forEach(handler => handler(channel, parsedMessage));
      } catch (error) {
        this.logger.error(`Failed to process message from channel ${channel}:`, error);
      }
    });
  }

  async subscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.logger.info(`Subscribed to channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to channel ${channel}:`, error);
      throw error;
    }
  }

  on(channel: string, callback: (channel: string, message: any) => void): void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, []);
    }
    this.handlers.get(channel)?.push(callback);
  }

  async close(): Promise<void> {
    await this.subscriber.quit();
    this.logger.info("Redis subscriber disconnected");
  }
}