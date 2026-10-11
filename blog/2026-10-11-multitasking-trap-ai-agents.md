---
title: "The Multitasking Trap"
subtitle: AI agents make it easy to start, and just as easy to overcommit. Every wait becomes an invitation to open a new task, and every task gets a little less of us.
description: AI coding agents tempt us to fill every wait with another task, or to trade quality for speed. Some thoughts on multitasking, Slow Productivity and Kent Beck's view on quality, and why waiting is part of the work.
tags: [ai, productivity, focus, software-quality]
---

A few days ago I ran an agentic workflow that went on for over forty minutes, developing and reviewing a feature. While it was running, I started another task in another session.

Is that multitasking? Where is the line?

I don't have a clear answer. But the question made me notice something I want to talk about.

LLMs have changed the way we develop software, and that brings good and bad things.

About a year ago I joined a company in a field where I had no prior experience. Within that first year I've done some heavy refactors of the core library. It was hard and time-consuming. But before AI, if someone had asked me to do this kind of refactor, I would have asked for more time to understand the product first. More likely, nobody would even have considered asking me to do heavy refactors on an almost 20-year-old codebase.

AI unblocks. It makes it easy to start. And that's exactly where the risk begins: **when starting is easy, it's also easy to overcommit**. We want to deliver more, and the people around us start expecting more. More importantly, ourselves want to deliver more.

This problem is not new. Cal Newport's *Slow Productivity* is not about AI, because these problems were there long before it. If you are any *knowledge worker*, you probably know the feeling: the urgency to get more done than you can.

Most of the time we try to keep up in one of two ways: we lower the quality of our output to get more things done, or we do many things at the same time.

By lowering the quality I mean shipping software without test coverage. Going to a meeting unprepared, or leaving without the information I needed. Creating software without clear, usable documentation. Releasing features without measuring their impact.

By multitasking I mean switching to something else during the short waits inside a task, or worse, during a meeting (which is also rude).

I've done all of these things, and I still do some of them.

Bubble or not, LLMs are here to stay, and they make both traps easier to fall into. While the agent is working, I can start something else. I can run multiple sessions in parallel. Every wait becomes an invitation to open a new task.

The agent produces code faster than I can understand and review it. With more sessions running, each output gets less of my attention. On paper I'm delivering more. In practice, every task gets a little less of me, and the quality drops without me noticing.

In *Extreme Programming Explained*, Kent Beck writes:

> You can't get software out the door faster by lowering quality. Instead, you get software out the door faster by raising quality.

Lowering quality to go faster is a bias, and AI makes it more tempting than ever. The speed is real at the start, but the work comes back. Software that isn't well tested ships with bugs, and every feature has to be fixed, and fixed, and fixed again. If you skip preparing for a meeting, you'll have to contact the person again, or worse, guess and make a bigger mistake. If you don't measure a feature's impact, you can't decide what to drop, and continue to maintain.

AI could push us in the opposite direction: writing better tests, doing deeper research, exploring more ideas within the same task. That's more depth, not more tasks. But it's not what happens by default. By default, we just do more.

So, back to my forty-minute workflow. Was it multitasking to do something else in the meantime?

I'm experimenting with a threshold of about fifteen minutes, but honestly I don't know where the line is. Every new task, even the "easy" ones, costs energy and attention. And the more I rush, the more likely it comes back to me.

What I do know is that the pressure to fill every wait is part of the problem. That feeling that you're "not doing enough" while the agent works is exactly what pushes us to open another task, then another, until none of them gets the attention it deserves.

Waiting is part of the work. You don't need to feel guilty about it.

If you feel annoyed, use this "free time" to go deeper and raise the quality of what you're doing: re-read the code your agent wrote, re-read the issue, ask another agent questions to better understand what is happening and why.
