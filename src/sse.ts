import { createSession, createChannel } from "better-sse";
import { User } from "./types";
import { Request, Response } from "express";
import { Publisher, Subscriber } from "./pubSub";

const REDIS_CHANNEL = "sse";

export class SSEService {

  private redisSubscriber: Subscriber;
  private redisPublisher: Publisher;
  private channel: ReturnType<typeof createChannel>

  constructor(redisSubscriber: Subscriber, redisPublisher: Publisher) {
    this.redisSubscriber = redisSubscriber;
    this.redisPublisher = redisPublisher;
    this.redisSubscriber.subscribe(REDIS_CHANNEL)
    this.channel = createChannel()
    this.notify()
  }

  async connect(req: Request, res: Response) {
    const user = req.user as User;
    const session = await createSession(req, res);
    session.state = { permissions: user.permissions, user: user.name }
    this.channel.register(session)
  }

  publish(event: string, data: any) {
    this.redisPublisher.publish(REDIS_CHANNEL, { event, data });
  }

  notify() {
    const callback = (channel: string, message: any) => {
      if (channel != REDIS_CHANNEL) return;

      const sessions = this.channel.activeSessions
      sessions.forEach(session => {
        const s = session as any
        const { event, data } = JSON.parse(message)
        const permissions = s.state.permissions as string[]
        if (permissions.includes(event)) {
          session.push(data, event)
        }
      })
    }
    this.redisSubscriber.notify(callback)
  }
}

export function newSSEService(redisSubscriber: Subscriber, redisPublisher: Publisher) {
  return new SSEService(redisSubscriber, redisPublisher);
}