+++
title =  "We need to talk about observability (Pt 1)"
tags = ["software", "engineering", "o11y"]
date = "2020-11-19"
+++

In the past year working at [cinch](https://www.cinch.co.uk/), a new buzzword came into my daily tech dictionary: `observability`, or simply `o11y`. I've spent a lot of time digging in to what it means in the context of a software system in the cloud that essentially is a website selling (and delivering) cars to customers entirely online. 

> What is observability? And why is it not yet another buzzword?

I've read too many of of Charity Major's [blog posts](https://charity.wtf/), listened to podcast episodes on [O11ycast](https://open.spotify.com/show/2x3IYa1tMQdQelf0Mu8ncF?si=O5QcL-rSS-Obdro7soXVaA)  or [rants](https://twitter.com/mipsytipsy/status/1305398051842871297) on twitter. So, typically, if you want to understand what observability is that should be more than  enough. Otherwise, keep reading if you want to get an idea of how I've experienced the o11y journey at [cinch](https://www.cinch.co.uk/).

If you prefer a visual short introduction to o11y at cinch (although  a few months old now), the [slide deck](https://www.beautiful.ai/player/-MMY5DbOi1S2c8J-vbQ0) may be handy.

### What happened to our story?

At cinch we have a distributed software system that is serving one strong coherent story: *buying a car of your choice entirely online and delivered for free to your home*. There are other side stories but they all hang from this well-defined story. As software engineers we can *mostly* explain how this story is consistent technically. We've built the components, we know how we deployed them, we understand how they interact with each other. In short, we know what promises the software system has made to deliver the story and we have a mental model in our heads of how the promises are kept.

> What happens when this well-defined story breaks down?

Promises are broken. Another story is created. But we can't explain it. What do engineers do in this case when they are asked (or ask themselves) to explain the collapse of the story (i.e. the promises)?

They sweat. And panic. And they wonder:

- Where are the logs?
- Which component has broken its promises?
- What behaviour are we observing?
- How can we get back to that safe and comfortable mental model?

### The inquiry begins

As software engineers, we become scientists. We become inquisitive with what we observe, we turn to method and attempt to build a hypothesis that we can use to explain the new reality. We try to confirm or reject our hypothesis so that we can solve the mystery or move on to the next hypothesis. However, we're far from our comfort zone of our `short satisfying feedback`: write code, deploy, observe, write code again, until we achieve implementing a promise we've set out to satisfy in our little bubble of our feature branches and ephemeral environments.

In this case though, we are in production. That lovely little feedback loop is not in our arsenal anymore. Our code, our components are running wild in the hands of consumers and attempting to keep their promises so that the story is kept in tact. But now the story has broken down. And makes no sense. What do we do? How do we make sense of what's going on?

### Observability is the pill

This is where observability comes in. We would like to ask questions about how our software system behaves so that we can confirm or reject our hypothesis. We want to extrapolate information about our software system running live in the wild by evaluating its outputs - without access to its internals: the code, combined with the data that runs through it, which make up the behaviour of the system at runtime. To achieve this, we can do with as many weapons in our arsenal as we can get. Remember, at this point we don't know anything about why our story - and our promises - are not holding up. We want to interrogate the outputs of our software components running wild in production in any way we need at that point in time.

### Enter contextual telemetry data

We want to be able to query the output in a way that narrows down our investigation. But we don't know ahead of time what we want to ask. Therefore our software system output needs to be `consistent` and `contextual`. We require our software system to enable us to work with our system's operational `telemetry data` output. The aim of this telemetry is that we should be able to answer questions like:

- how is the software system behaving? e.g. what is going wrong?
- why is it behaving this way?
- what are the reasons it is behaving this way?
- when did it go wrong?
- was it due to a deployment?
- was it a 3rd party starting to behave in an unexpected way?
- what is it an edge case of data that lead the software system to behave this way?
- etc.

### Logs and metrics are not enough

Some key interrogations may have not been anticipated by the engineers who wrote the code. No free text log such as:

```text
Order 123 created successfully
```

followed by

```text
An error occured - an exception occured on line 5.
```

is particularly useful on the face of it without context switching to the actual code or a non-prod environment. Or being so eagle eyed that you chain the CloudWatch logs together.

Neither is a metric, evaluated in the last hour as:

```text
number_of_failed_orders_created=5
number_of_failed_orders_completed=4
```

Yeah. Great. And then what? That tells us something *may* be going wrong.

We can't dig any deeper into this with either logs or metrics. Our next step is to jump into the code and start imagining the code running and evaluating function and variable evaluations in order in our heads. Alternatively, we could jump into a non-prod environment and try to reproduce it. But what if we don't know where to start? We've never worked in this subdomain of the software before. It gets hard and complicated at a time that's stressful.

> Disclaimer: I understand that at this point someone might argue that there is a middle ground: structured logging. From my experience this takes you a lot further but misses some core concepts from distributed tracing. I will not attempt to delve deeper into this argument right now.

So in this case, rather than logging free text logs or metrics alone, what is required is that we adopt a continuous observability practise of `instrumenting` our code according to distributed tracing conventions - more specifically logging spans (respecting [OpenTelemetry](https://opentelemetry.io/docs/concepts/what-is-opentelemetry/) standards).

### Traces and spans

For each component invocation, in our case a lambda handler invocation, a construct called a `span` is created. A span is the minimum unit of work in distributed tracing. A tree of spans form a trace.

> AWS X-Ray calls spans segments and subsegments. This is confusing, so I will stick with the [OpenTelemetry terminology](https://opentelemetry.io/docs/concepts/data-sources/).

Spans can be created and filled with context automatically by configuring the lambda with a simple lambda handler wrapper:

```ts
const OKHandler = async (_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => jsonOK();

// Adds observability to your handler
export default withObservability((OKHandler));
```

This will simply automatically add a span for the handler and enrich it with any context, i.e. key/value pairs and metadata, from the http request.

### Manual instrumentation

Manual, you say? Not interested.

However, actually adding context manually has huge benefits. The engineer who is writing the code knows by far the most about what is going on during the handler invocation. While writing the code, they've engineered it so that it holds up a promise, e.g. creating an order. So they've thought about all (or almost all) eventualities. What's worse, the engineer writing that code `at that time only` knows the most about the context of that lambda invocation. A few minutes later that knowledge drops dramatically.

> Why waste that rich knowledge?

When writing a handler that creates an order for example, the traditional thought process of '*there's something interesting happening here, I better log it with free text or emit a custom embedded metric with value 1*', offers value over not logging anything at all for sure but lacks in `consistency` and `context`. Lack of consistency because we don't know how this is logged elsewhere in the software system, and hence makes aggregation hard cross lambdas. Lack of `context` because it doesn't provide any other information about what was happening around the time this happened, e.g. order had a very high value. This may not seem useful right now. But how do you know it's not useful in the future?

By enriching the span instead with all the key/value pairs that *may* be notable, and therefore potentially useful in the future, you are enabling observability. That's it. You are enabling answering the unknown unknowns, rather than only the known unknowns.

As part of writing our lambda handler, instrumenting it with telemetry, essentially means intelligently adding `key/value pairs` to our span, that can either be domain specific identifiers or Requests, Errors or Durations (RED) metrics.

> AWS X-Ray also calls key/value pairs `annotations`, which is even more confusing. I'll call them annotations in the code examples but as key/value pairs to keep a generic term when explaining the concept

Note that the keys in this case must be globally unique in the telemetry dataset. This attribute of the keys provides deep consistency across the telemetry dataset and allows for searches across spans that belong to different traces (different lambdas too!). A span also contains metadata for its operation, e.g. to identify its name and start and end times etc.

So, the practise of instrumenting a lambda handler becomes a case of identifying whether a key/value pair is worth adding. Some good points to consider this is at:

- the entry point of a lambda handler
- all exit points of a lambda handler (including errors in try/catch)

### Create order handler example

In our example of a handler that creates an order, adding the following:

```ts
segment.addAnnotation('userId', '123');
segment.addAnnotation('orderId', '5');
segment.addAnnotation('orderValue', 10000);
segment.addAnnotation('orderCreated', true);
```

When there is an error, add an error to the segment, by giving it a useful description too:

```ts
catch (err) {
    segment.addError(err, 'Create order handler failed');
}
```

This provides high `consistency` across lambdas as `userId` and `orderId` can be common across lambdas (assuming a naming convention here) - allowing for slicing and dicing the telemetry dataset across the software system. This also provides loads of context in the sense that the interrogator of the telemetry dataset not only can find out that the order was created but they could by find out for what user, what order value, what error occurred (if it errored) etc.

### Navigating through the telemetry dataset

Apart from the practise of instrumenting code for observability, the other major component of observability is the telemetry data visualisation tool. Navigating through the telemetry data in your observability tool of choice depends on how mature the instrumentation is across the system - see `consistency` and `context`.

In short, there are few starting points that someone can start their interrogation from:

- `service names`: one or more lambda handlers are are mapped to well-defined entities, e.g. services. The service names clearly indicate their purpose and the promises that they have made
- `key/value pairs`: these are globally unique, so querying for `orderCreated` should return a list of spans that have `orderCreated` against them across traces of the same lambda or any other lambda
- `metrics`: metrics are also globally unique. These can either be queries separately or as part of the same telemetry dataset as the spans - this really depends on the tool you use. [Datadog](https://www.datadoghq.com/) and [AWS X-Ray](https://aws.amazon.com/xray/) definitely don't offer this unified telemetry dataset but based on the [white paper](https://www.honeycomb.io/wp-content/uploads/2020/09/Getting-metrics-into-honeycomb-whitepaper.pdf) from Honeycomb on metrics, I believe they do.

With the above setup, we should be able to aggregate or trace the spans to be able to answer questions that will help us validate or invalidate our hypothesis at any point in time. 


### Disclaimers

Observability's scope as outlined above is strictly engineering and operational. You could see data lake services such as Snowflake and Metabase as providing observability. Similarly, operational analytics tools such as Segment and Adobe Analytics could be considered as tools that provide observability into the software system. These argument may have merit but have not considered here. Also note that you may not only have lambdas as part of your system - we don't either. But for simplicity, I chose to focus on lambdas.

### Conclusion

In my head, observability is part of the `DevOps` culture.

As a consequence, observability should be used as an important catalyst to achieve the [Second Way of DevOps](https://itrevolution.com/the-three-ways-principles-underpinning-devops/):

> The Second Way is about creating the right to left feedback loops. The goal of almost any process improvement initiative is to shorten and amplify feedback loops so necessary corrections can be continually made. The outcomes of the Second Way include understanding and responding to all customers, internal and external, shortening and amplifying all feedback loops, and embedding knowledge where we need it.

### Part 2

In part 2, I will try to describe why I think practising observability principles to have a highly mature telemetry dataset is not only useful for when well-formed stories break down. It's also useful to really understand the behaviour of your system, i.e get a more granular and well-informed idea of how those stories are keeping up. In the same way that you know how your laptop behaves from day to day - what app you decide to run or how many tabs in the browser you open lead to the machine behaving quite differently under different configurations. The code running in production essentially forms the product, therefore we want to understand how that behaves from day to day. This requires us to essentially `live in production` by querying our telemetry data on a daily basis. I'll also try to illustrate when to add a key/pair to the span and when to emit a metric. Finally, I'll try to address the question: are logs needed at all when practising observability?

##### References

1. https://itrevolution.com/the-three-ways-principles-underpinning-devops/