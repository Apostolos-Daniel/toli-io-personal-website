// worker.test.js
import { Miniflare } from "miniflare";

describe("Worker", () => {
  let mf;

  beforeAll(async () => {
    mf = new Miniflare({
      // Miniflare options here
    });
  });

  test("should forward request to Durable Object", async () => {
    const env = await mf.getBindings();
    const request = new Request("http://localhost/subscribe", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await mf.dispatchFetch(request);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe("Subscribed successfully");

    // Verify Durable Object received the request
    const stub = await env.SUBSCRIBER_STORE.get(env.SUBSCRIBER_STORE.idFromName("default"));
    const state = await stub.storage.get("subscribers");
    expect(state).toContain("test@example.com");
  });
});
