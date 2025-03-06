import { createSession, createChannel } from "better-sse";
import { Request, Response, NextFunction } from "express";
import { Logger } from "winston"; // Assuming winston for logging
import { z } from "zod"; // For validation
import { Publisher, RedisConfig, Subscriber } from "./pubSub";


export interface SSEConfig {
  channel: string;
  heartbeatInterval?: number; // milliseconds
}

// Type definitions
export interface User {
  id: string;
  name: string;
  permissions: string[];
}

// Message schema
const MessageSchema = z.object({
  event: z.string(),
  data: z.any()
});

type Message = z.infer<typeof MessageSchema>;

// SSE Service Class
export class SSEService {
  private redisSubscriber: Subscriber;
  private redisPublisher: Publisher;
  private channel: ReturnType<typeof createChannel>;
  private config: SSEConfig;
  private logger: Logger;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(redisSubscriber: Subscriber, redisPublisher: Publisher, config: SSEConfig, logger: Logger) {
    this.redisSubscriber = redisSubscriber;
    this.redisPublisher = redisPublisher;
    this.config = config;
    this.logger = logger;
    this.channel = createChannel();
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.redisSubscriber.subscribe(this.config.channel);
      this.setupMessageHandler();
      this.setupHeartbeat();
      this.logger.info("SSE Service initialized");
    } catch (error) {
      this.logger.error("Failed to initialize SSE Service:", error);
      throw error;
    }
  }

  private setupMessageHandler(): void {
    this.redisSubscriber.on(this.config.channel, (channel, rawMessage) => {
      try {
        const messageResult = MessageSchema.safeParse(rawMessage);
        if (!messageResult.success) {
          this.logger.warn("Invalid message format:", messageResult.error);
          return;
        }
        
        const message = messageResult.data;
        this.broadcastMessage(message);
      } catch (error) {
        this.logger.error("Error processing message:", error);
      }
    });
  }

  private setupHeartbeat(): void {
    if (this.config.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        try {
          const sessions = this.channel.activeSessions;
          if (sessions.length > 0) {
            this.logger.debug(`Sending heartbeat to ${sessions.length} active sessions`);
            sessions.forEach(session => {
              session.push({ timestamp: new Date().toISOString() }, "heartbeat");
            });
          }
        } catch (error) {
          this.logger.error("Heartbeat error:", error);
        }
      }, this.config.heartbeatInterval);
    }
  }

  private broadcastMessage(message: Message): void {
    const sessions = this.channel.activeSessions;
    let deliveredCount = 0;
    
    sessions.forEach(session => {
      try {
        const userState = session.state as { permissions: string[]; user: string };
        
        if (userState?.permissions?.includes(message.event)) {
          session.push(message.data, message.event);
          deliveredCount++;
        }
      } catch (error) {
        this.logger.error(`Failed to deliver message to session:`, error);
      }
    });
    
    this.logger.debug(`Message broadcast: ${deliveredCount}/${sessions.length} sessions received event '${message.event}'`);
  }

  async connect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as User;
      
      if (!user || !user.permissions) {
        res.status(401).send("Unauthorized");
        return;
      }
      
      const session = await createSession(req, res);
      session.state = { 
        permissions: user.permissions, 
        user: user.name,
        userId: user.id,
        connectedAt: new Date().toISOString()
      };
      
      this.channel.register(session);
      
      this.logger.info(`User ${user.name} (${user.id}) connected to SSE`);
      
      // Send initial connection success event
      session.push({ connected: true, timestamp: new Date().toISOString() }, "connection");
      
      // Session cleanup on close
      res.on("close", () => {
        this.logger.info(`User ${user.name} (${user.id}) disconnected from SSE`);
      });

    } catch (error) {
      this.logger.error("Error establishing SSE connection:", error);
      next(error);
    }
  }

  publish(event: string, data: any): Promise<number> {
    try {
      const message: Message = { event, data };
      return this.redisPublisher.publish(this.config.channel, message);
    } catch (error) {
      this.logger.error("Error publishing event:", error);
      throw error;
    }
  }

  getActiveSessionsCount(): number {
    return this.channel.activeSessions.length;
  }

  getActiveSessionsByPermission(): Record<string, number> {
    const permissionCounts: Record<string, number> = {};
    
    this.channel.activeSessions.forEach(session => {
      const userState = session.state as { permissions: string[] };
      
      if (userState?.permissions) {
        userState.permissions.forEach(permission => {
          permissionCounts[permission] = (permissionCounts[permission] || 0) + 1;
        });
      }
    });
    
    return permissionCounts;
  }

  async close(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Notify all sessions of shutdown
    this.channel.activeSessions.forEach(session => {
      try {
        session.push({ message: "Server shutting down" }, "shutdown");
      } catch (error) {
        this.logger.error("Error sending shutdown notification:", error);
      }
    });
    
    this.logger.info("SSE Service shutting down");
  }
}

// Factory functions
export function createRedisPublisher(config: RedisConfig, logger: Logger): Publisher {
  return new Publisher(config, logger);
}

export function createRedisSubscriber(config: RedisConfig, logger: Logger): Subscriber {
  return new Subscriber(config, logger);
}

export function createSSEService(config: SSEConfig, redisConfig: RedisConfig, logger: Logger): SSEService {
  const publisher = createRedisPublisher(redisConfig, logger);
  const subscriber = createRedisSubscriber(redisConfig, logger);
  return new SSEService(subscriber, publisher, config, logger);
}