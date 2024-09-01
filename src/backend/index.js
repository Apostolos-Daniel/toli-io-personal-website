import { SubscriberStore } from './subscriberStore';

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const instanceName = url.pathname.split('/')[1] || "default"; // Extract the first segment or use "default"
      console.log(`Instance name: ${instanceName}`);
      
      const id = env.SUBSCRIBER_STORE.idFromName(instanceName);
      console.log(`Durable Object ID: ${id}`);
      
      const stub = env.SUBSCRIBER_STORE.get(id);
      console.log(`Durable Object stub: ${stub}`);
      
      const response = await stub.fetch(request);
      return response;
    } catch (error) {
      console.error('Error in fetch handler:', error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};


// This is the crucial part:
export { SubscriberStore };