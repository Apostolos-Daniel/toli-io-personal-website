export class SubscriberStore {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    console.log(`Durable Object initialized with ID: ${state.id.toString()}`);
  }

  async fetch(request) {
    console.log('Durable Object received request:', request.url);
    console.log('Current Durable Object ID:', this.state.id.toString());
    try {
      const url = new URL(request.url);
      
      if (url.pathname === "/subscribe") {
        return await this.handleSubscribe(request);
      } else if (url.pathname === "/subscribers") {
        return await this.handleGetSubscribers();
      }

      return new Response("Not Found", { status: 404 });
    } catch (error) {
      console.error('Error in Durable Object fetch method:', error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  async handleSubscribe(request) {
    try {
      const formData = await request.formData();
      const email = formData.get('email');
      console.log('Subscribing email:', email);
      
      if (!email) {
        return new Response("Invalid email", { status: 400 });
      }
      
      let subscribers = await this.state.storage.get("subscribers") || [];
      console.log('Subscribers before addition:', subscribers);
      
      subscribers.push(email);
      await this.state.storage.put("subscribers", subscribers);
      
      console.log('Subscribers after addition:', subscribers);
      
      // Immediate fetch after storage
      const storedSubscribers = await this.state.storage.get("subscribers") || [];
      console.log('Subscribers immediately after storage:', storedSubscribers);
      
      return new Response("Subscribed successfully", { status: 200 });
    } catch (error) {
      console.error('Error in handleSubscribe:', error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  async handleGetSubscribers() {
    try {
      const subscribers = await this.state.storage.get("subscribers") || [];
      console.log('Retrieved subscribers:', subscribers);
      return new Response(JSON.stringify(subscribers), { status: 200 });
    } catch (error) {
      console.error('Error in handleGetSubscribers:', error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
}
