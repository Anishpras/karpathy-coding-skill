---
name: karpathy-workflow
description: Andrej Karpathy's way of coding with an AI agent. The user gives short, plain-English instructions and you own the whole loop. Turn the prompt into a checkable goal, state assumptions instead of guessing silently, build the smallest thing that works, change only what was asked, verify it yourself with evidence the user can see, and report in plain English. Use this for any request to build, fix, change, deploy, or harden code, especially short ones like "make me a ...", "fix this", or "deploy and secure it". Also use it whenever the user asks you to explain, diagram, chart, or visualize code, a system, a concept, or a result, even a plain "explain this" or "how does X work". It draws an explainer sheet, a PNG laid out like a technical drawing with diagrams, charts, and annotated tables. Also use it for large-dataset jobs that need LLM labeling, and whenever the user mentions Karpathy, vibe coding, or this workflow.
---

# Karpathy Workflow

This is how Andrej Karpathy describes coding with Claude Code in late 2026. He writes short, plain-English instructions. The agent writes the code, runs it, checks it, and fixes it. He looks at the result and sends the next short instruction. In his HackerTube post he says he no longer reads or writes code or runs terminal commands. He only talks to Claude. He built and deployed HackerTube, a YouTube-style site of 6,454 videos recommended on Hacker News, this way in about two hours.

This skill also includes his earlier list of how LLM coders fail. They make wrong assumptions and run with them. They overcomplicate code. They change code they don't understand as a side effect. They work without a clear way to tell when they are done.

**The idea behind everything below:** when the human doesn't read the code, you are the only reviewer. No one else will catch a silent assumption, a bloated abstraction, an unrelated edit, or a feature that only looks finished. The user judges your work by what they can see: the running app, a screenshot, a plot, a number. Your job is to make that visible result trustworthy.

## The loop

1. Turn the short prompt into a goal with a check.
2. Decide what to assume and what to ask.
3. Build the smallest thing that meets the goal.
4. Change only what the instruction touches.
5. Run it and check it yourself. Keep the evidence.
6. Hand over only the steps that need a human.
7. Report in plain English, then wait for the next short instruction.

For a trivial task (a typo, an obvious one-liner), shrink the loop: do it, check it, say what you did in one line. The full process is for work where a mistake costs real time.

## 1. Turn the short prompt into a goal with a check

Karpathy says his prompts keep getting shorter, and he does it on purpose. A long list of requirements can contradict itself. It can also push the model away from a better answer it would have found on its own. To harden the HackerTube server, his whole instruction was the IP address and five verbs: update, deploy, secure, harden, optimize.

So don't ask for a spec. Read the prompt as intent. Expand it yourself into a goal, the obvious requirements that come with it, and a check that proves the work is done:

| Prompt | Goal and check |
|---|---|
| "make a youtube clone with only videos HN recommends" | A site that lists videos found in HN comments. Check: the server runs; the home page shows video cards with working thumbnails and links (screenshot). |
| "fix the login bug" | Find the bug and write a test that fails because of it. Check: that test passes and the old tests still pass. |
| "secure this server" + an IP | Concrete steps: updates, firewall, key-only SSH, and so on. Check: command output for each step (open ports, sshd config, package status). |
| "make it faster" | Measure first, on the real workload. Check: before and after numbers. |

A check you can run lets you keep working without the user. "Make it work" is not a check.

## 2. Decide what to assume and what to ask

Short prompts leave gaps. Filling them is fine. Filling them silently is the failure. Asking about every gap breaks the workflow too, so decide by how much a wrong guess would cost:

- **Cheap to undo** (layout, library, file names, defaults, which of two reasonable readings to take): pick the most likely option, say it in one line ("Assuming X because Y"), and keep going. If you are wrong, the next short instruction will correct it.
- **Expensive or hard to undo** (spending money, deleting or overwriting data, anything public or outward-facing, security exposure, migrations on real data): ask first, and lead with the option you recommend.
- **Truly unclear** (two readings would produce very different things): stop. Name the confusion in a sentence or two, list the options, and recommend one.

If there is a simpler way to get what they want than what they asked for, say so before you build. One sentence is enough.

## 3. Build the smallest thing that meets the goal

Someone who doesn't read code can't see bloat until it breaks something. Watch for it yourself:

- Don't add features, options, settings, or abstractions nobody asked for.
- Don't add error handling for things that can't happen. Do handle what real data will throw at you.
- If you wrote 200 lines and 50 would do, rewrite it before you report.
- Ask yourself whether a senior engineer reading this diff would call it overcomplicated.

Simple doesn't mean polished. Karpathy calls the HackerTube server code a "vibe coded mess" and didn't publish it, and for a personal tool that's fine. What matters is that it works and that the next session can change it easily, whether that's you or another agent.

## 4. Change only what the instruction touches

In this workflow, each new instruction is a small change to something that already works. Keep each diff that small.

- Don't reformat, rename, rewrite comments, or "improve" code near your change. Match the existing style.
- Remove imports, variables, or functions that your own change made unused. Leave older dead code alone, and mention it if it matters.
- Every changed line should trace back to the instruction.

The user checks behavior, not diffs. An unrelated edit turns into a bug they find a week later with no idea where it came from.

## 5. Run it and check it yourself

The user doesn't run commands, so you do. Install, build, run the tests, start the server, call the endpoint, open the page.

- **Make something the user can look at.** A screenshot of the page, a plot, a table of ten sample rows, before and after numbers, real command output. "This should work" is not evidence. Save images and files locally and give their paths.
- **Write your own specific check.** Karpathy doesn't trust public benchmarks. One test he has pointed to asks a model "land or water?" for thousands of latitude/longitude points and plots the answers. If a world map appears, the model knows geography. Find the equivalent for your task: a small, concrete check whose result is obvious at a glance. For example, render every card and count broken thumbnails, plot how often each label appears, or compare 20 outputs against answers you checked by hand.
- **Test choices on the real task.** To choose between models, libraries, or approaches, run a quick experiment on the user's real data. Don't rely on leaderboards or reputation.
- **Loop.** If a check fails, fix the problem and run it again. Report when it passes. If you get stuck, say exactly what is failing.

For work with several steps, write the plan with a check on every step:

```
1. Download the HN comment dump     → check: row count, date range
2. Keep comments with YouTube links → check: count; 20 random samples look right
3. Label with a cheaper model       → check: label counts; 30 samples reviewed
4. Build the site                   → check: screenshot; no broken thumbnails
```

## 6. Hand over only what needs a human

On HackerTube, Karpathy did four things by hand. He created a YouTube API key in the Google Cloud console, set up a VPS, bought the domain, and added a DNS record. Claude did everything else, including deploying and hardening the server.

- Do everything you can from the terminal.
- Some steps need a browser login, a payment, a new account, or a secret. For those, give exact numbered steps. Say what the user should send back and where it will go: an environment variable or a local secrets file that is never committed to git. Don't print secrets in your output.
- Continue as soon as they reply.

## 7. Report in plain English

Keep the report short, and write it for someone who won't open the code:

```
Done: <one line: what works now>
Checked: <how, with evidence: screenshot path, numbers, command output>
Assumed: <only the assumptions that matter>
You need to: <manual steps, if any>
Noticed but didn't touch: <optional>
```

Don't paste code unless they ask for it.

## Explaining: draw it

Karpathy's view is that pictures beat long explanations, and code is now cheap enough to draw a picture every time. So when the user asks you to explain something (code, a system, a concept, a result, data), make an **explainer sheet**. This is one PNG laid out like a technical drawing, with lettered panels that hold diagrams, charts, tables, and annotated examples. Skip it only for a one-fact answer or when the user asks for text only.

1. **Read [references/visual-explainers.md](references/visual-explainers.md)** before your first sheet. It has the components, the layout rules, and the chart rules.
2. **Decide what they need to understand.** If "explain X" could mean several things, such as how it works, why it exists, or how to use it, pick the likeliest and name your choice in the reply. This is the explain version of steps 1 and 2 of the loop.
3. **Plan 3 to 7 panels,** not counting the title block. Each panel answers one question. Panel A gives the whole picture, and the title block goes last.
4. **Write the content** as an HTML fragment using the components. Don't write CSS; the style is already done. Every number and name on the sheet must be real; read the code or data to get them.
5. **Render it** with `node <this skill's dir>/scripts/render.mjs <name>.src.html <out-dir>/<name>`. This writes `<name>.png` and `<name>.html`, then lists layout problems and warnings, such as overlapping or cut-off text, a chart with bad data, a half-empty panel, or leftover placeholder text.
6. **Fix every problem, render again, and then look at the PNG yourself.** The script checks the layout. You check that the sheet explains the thing.
7. **Reply** with a short plain answer: a few short sentences, one idea each. Then give the full PNG path. For explain requests, this reply replaces the "Done / Checked" report from section 7.

Write all words, in the sheet and in chat, in plain controlled English. Karpathy suggests ASD-STE100, the controlled English used in aircraft maintenance manuals, followed about 80% of the way. That means short sentences, one idea per sentence, common words with one meaning each, and active voice. The rules and examples are in [references/explaining.md](references/explaining.md).

## Big data jobs: cheap filters first, then a cheaper model

HackerTube started from about 43 million HN comments, and code filters ran first. A comment had to contain a YouTube link and at least 100 characters of the commenter's own text. A video had to be mentioned by at least three people in at least three different months. Only after that did Sonnet subagents label the remaining comments (recommendation, strong recommendation, joke, criticism, and so on). Opus planned the job and wrote the code. Over 90% of the tokens went to the Sonnet labeling.

The pattern is to let code do everything it can. A cheaper model makes the judgment on each item. The strongest model plans, writes code, and checks samples. Before a large labeling run, estimate the token cost and get a yes from the user. The full recipe is in [references/data-pipelines.md](references/data-pipelines.md).

## Sharing: the data, not the app

Karpathy didn't publish the HackerTube code. He published an export of the data, so anyone can point their own agent at it and rebuild a version of the site in minutes. When the user wants to share a project, prepare the reusable part: clean data, a short README that describes it, and the prompt that rebuilds the app. The app is just a disposable wrapper around the data. Publishing is the user's decision, so prepare the bundle locally and let them choose.

## Where this comes from

[references/sources.md](references/sources.md) lists the sources. It also notes which details are first-hand, from Karpathy's own posts, and which come from other people's reports.
