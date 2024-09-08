// tests/subscriberStore.test.js
import { DurableObjectNamespace, Miniflare } from "miniflare";
import { SubscriberStore } from "../src/backend/subscriberStore";

describe("SubscriberStore Durable Object", () => {
  let mf;
  let stub;

  beforeAll(async () => {
    mf = new Miniflare({
      durableObjects: { SUBSCRIBER_STORE: { className: "SubscriberStore" } },
      modules: true,
    });

    // Create a Durable Object stub (simulates the object for testing)
    const ns = await mf.getDurableObjectNamespace("SUBSCRIBER_STORE");
    stub = await ns.get(ns.idFromName("test"));
  });

  test("should subscribe an email", async () => {
    const request = new Request("http://localhost/subscribe", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await stub.fetch(request);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe("Subscribed successfully");

    // Verify the email is stored correctly
    const state = await stub.storage.get("subscribers");
    expect(state).toContain("test@example.com");
  });

  test("should get list of subscribers", async () => {
    const request = new Request("http://localhost/subscribers");
    const response = await stub.fetch(request);
    expect(response.status).toBe(200);
    const subscribers = await response.json();
    expect(subscribers).toContain("test@example.com");
  });
});
