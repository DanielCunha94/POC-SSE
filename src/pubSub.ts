import Redis from "ioredis";

export class Publisher {
  private publisher

  constructor() {
    this.publisher = new Redis()
  }

  publish(channel: string, message: any) {
    this.publisher.publish(channel, JSON.stringify(message));
  }

}

export class Subscriber {

  private subscriber

  constructor() {
    this.subscriber = new Redis()
  }

  subscribe(channel: string) {
    this.subscriber.subscribe(channel)

  }

  notify(callback: (channel: string, message: any) => void){
    this.subscriber.on("message", callback);
  }
}

export function newPublisher() {
  return new Publisher()
}

export function newSubscriber() {
  return new Subscriber()
}
