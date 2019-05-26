+++
title =  "MS Build 2019: Reading between the lines"
tags = ["build", "microsoft", ".NET", "blazor", "webassembly"]
date = "2019-05-20"
+++
A number of announcements made at [Microsoft Build](https://www.microsoft.com/en-us/build) this year caught my eye. More specifically, I think two of them are pivotal for the future of **.NET**: 

1. **.NET 5** - a merger between all .NET runtimes into one single unified platform.
2. **Blazor** is now a **preview** rather than experimental

## .NET 5

In my eyes this is massive and the funny thing is that we all saw it coming. I challenge you to read the [blog post](https://devblogs.microsoft.com/dotnet/net-core-is-the-future-of-net/) and let it sink in:

#### .NET Framework is being retired faster and earlier than we all thought

And on the back of this, Microsoft announced [.NET 5](https://devblogs.microsoft.com/dotnet/introducing-net-5/):

```
"There will be just one .NET going forward, and you will be able to use it to target Windows, Linux, macOS, iOS, Android, 
tvOS, watchOS and WebAssembly and more."
```
Essentially, Microsoft are combining the various runtimes and frameworks (.NET Framework, .NET Core, Mono, Xamarin etc.) into a single .NET runtime and framework that has uniform runtime behaviours and developer experiences - and they're calling it **.NET 5**.

![](.NET%205.PNG)

#### .NET Framework Rest In Peace

Microsoft has good track record of supporting **legacy** platforms and frameworks. 

```
"Existing applications are safe to remain on .NET Framework which will be supported."
```

Yes, **.NET Framework** will be supported going forwards, but will it be enhanced? Will it be a priority?

```
"Existing applications that want to take advantage of the new features in .NET should consider moving to .NET Core. "
```

I mean, this isn't really reading between the lines. Microsoft is spelling this out loud. Move your applications - where possible - to **.NET Core**!

#### .NET Core is the Future

Ever since .NET Core was announced and version **1.0** was released, the .NET community knew **.NET Core** was the future. Understandably, Microsoft has thrown **Mono** into the mix, which I suspect is also to support client-side **Blazor** - and obviously Xamarin.

```
"New applications should be built on .NET Core. .NET Core is where future investments in .NET will happen."
```

For me, this is a **positive** development. I prefer that Microsoft communicates this to the .NET community early, rather than pretending to sit on the fence. .NET Framework is being actively deprioritised, all future releases will be based on **.NET Core**. 

#### November 2020

```
"We intend to release .NET 5 in November 2020, with the first preview available in the first half of 2020"
```

At my current workplace, we have **November 2020** circled on our road map. Any new applications are being developed using **.NET Core**, any important existing .NET Framework applications will slowly transition to **.NET Core** where possible.

I'll try to document this process in a series of future blog posts. 

## Blazor

The other thing that caught my eye and got me excited is the [announcement of Blazor](https://mybuild.techcommunity.microsoft.com/sessions/77033?source=sessions#top-anchor) not being experimental anymore - it's now in **preview**. Blazor was a project that started just a couple of years ago when Microsoft decided to jump on the **WebAssembly** band waggon. 

#### Web Assembly

[Web Assembly](https://webassembly.org/) in a nutshell provides a way to run code written in any language on any web browser. This is a game changer as developers can write apps in their language of choice and compile them in **WASM** format - shorthand for Web Assembly.

#### Enter Blazor

Microsoft got involved with Web Assembly early on, essentially trying to utilise Web Assembly for ASP.NET Razor-like development of web apps. 

For more information here's some nice resources to get started:

- [What is Blazor and What is Razor Components](https://www.hanselman.com/blog/WhatIsBlazorAndWhatIsRazorComponents.aspx)
- [Blazor demo at MS Build](https://mybuild.techcommunity.microsoft.com/sessions/77033?source=sessions#top-anchor)
- [Get started with Blazor](https://docs.microsoft.com/en-us/aspnet/core/blazor/get-started?view=aspnetcore-3.0&tabs=visual-studio)

### Client vs Server Hosting model

The most interesting aspect of the Blazor project is that there are two different **hosting models** proposed by the Blazor team:

- Client side
- Server side

#### Client side

This model entails loading the entire .NET runtime (Mono in this case) in the browser. This may be quite an issue as it may be quite large and impact load time performance.

![](../Blazor%20client%20side.PNG)

#### Server side

This model *seems* to be the recommended one by the Blazor team although they seem to use the Client side model almost as a clickbait. In this model a stable SignalR connection is used to update the various parts of the component when and if they are needed.

![](../Blazor%20server%20side.PNG)

Or at least that's my understanding at this point.

## Behind The Buzzword - Blazor & WebAssembly - The Future?

I'm currently preparing a kata-form workshop for a local meetup in Manchester, UK, called [Behind The Buzzword](https://www.meetup.com/en-AU/Behind-The-Buzz-Word/events/261514601/). Through this process I hope to get a better understanding of how Blazor works and how at the end of the day it will be useful to build modern web apps with C#. 

Follow me on twitter - [@apostolis09](https://twitter.com/apostolis09) - to get updates for my next blog posts.