import { SubscriberStore } from './subscriberStore';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Get the Durable Object ID for the subscribers
    const id = env.SUBSCRIBER_STORE.idFromName("default");
    const obj = env.SUBSCRIBER_STORE.get(id);

    // Forward the request to the Durable Object
    return await obj.fetch(request);
  }
}

export { SubscriberStore };
