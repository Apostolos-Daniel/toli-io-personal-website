export class SubscriberStore {
    constructor(state, env) {
      this.state = state;
      this.env = env;
    }
  
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === "/subscribe") {
        return this.handleSubscribe(request);
      } else if (url.pathname === "/subscribers") {
        return this.handleGetSubscribers();
      }
      return new Response("Not Found", { status: 404 });
    }
  
    async handleSubscribe(request) {
      try {
        const data = await request.json();
        const email = data.email;
  
        if (!email || !this.validateEmail(email)) {
          return new Response("Invalid email", { status: 400 });
        }
  
        let subscribers = await this.state.storage.get("subscribers");
        if (!subscribers) {
          subscribers = [];
        }
  
        if (!subscribers.includes(email)) {
          subscribers.push(email);
          await this.state.storage.put("subscribers", subscribers);
        }
  
        return new Response("Subscription successful", { status: 200 });
      } catch (error) {
        return new Response("Error processing subscription", { status: 500 });
      }
    }
  
    async handleGetSubscribers() {
      const subscribers = await this.state.storage.get("subscribers") || [];
      return new Response(JSON.stringify(subscribers), {
        headers: { "Content-Type": "application/json" },
      });
    }
  
    validateEmail(email) {
      const re = /\S+@\S+\.\S+/;
      return re.test(email);
    }
  }
  