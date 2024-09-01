export class SubscriberStore {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    console.log('Durable Object received request:', request.url);
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
      const formData = await request.formData()
      const email = formData.get('email')
      console.log('Subscribing email:', email);
      
      if (!email) {
        return new Response("Invalid email", { status: 400 });
      }
      
      let subscribers = await this.state.storage.get("subscribers") || [];
      subscribers.push(email);
      await this.state.storage.put("subscribers", subscribers);
      console.log('Successfully subscribed:', email);
      return new Response("Subscribed successfully", { status: 200 });
    } catch (error) {
      console.error('Error in handleSubscribe:', error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  async handleGetSubscribers() {
    try {
      const subscribers = await this.state.storage.get("subscribers") || [];
      console.log(`Subscribers: ${subscribers}`)
      return new Response(JSON.stringify(subscribers), { status: 200 });
    } catch (error) {
      console.error('Error in handleGetSubscribers:', error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
}
