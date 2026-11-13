# Sources

## First-hand (Karpathy's own words)

- **HackerTube post**, Oct 31, 2026: https://karpathy.bearblog.dev/hacker-tube/
  - His setup, from the post's edit: the Claude Code desktop app on Mac, with Opus 5.5 at Medium effort as his default.
  - He no longer reads or writes code or runs terminal commands. He only talks to Claude.
  - His manual steps: a YouTube API key, a VPS, and the domain.
  - He gave Claude the server IP and asked it to "update, deploy, secure, harden, and optimize."
  - Sonnet labeled the comments through a Claude Code Workflow.
  - He published a data export so others can build their own version.
- **X post on LLM coding pitfalls**, Jan 2026: https://x.com/karpathy/status/2015883857489522876
  - The basis of the four guidelines: silent wrong assumptions, overcomplication, side-effect edits, and success criteria.
  - The repo below quotes it.

## Reported by others (not checked against the original)

- **His HN comments on the HackerTube thread**, as reported in secondary write-ups:
  - his prompts getting shorter ("shorter and dumber")
  - the DNS record step
  - the token counts (504M in, 7.6M out)
  - his distrust of benchmarks, and his pointer to Epoch's ECI instead
- **His Oct 1, 2026 X thread**, as reported:
  - ASD-STE100 at about 80%
  - the picture ladder: diagram, then HTML, then explainer video
  - the land-or-water model test, which was someone else's eval that he shared
- **The filter thresholds and the scoring formula**: from the HackerTube data export, as described by Kingy.ai.
- **Being polite to Claude** (greeting it, asking it not to make mistakes): reported in the video from a press report and not found in his own posts. It is left out of the skill.

## What this skill was built from

- **multica-ai/andrej-karpathy-skills** (MIT): https://github.com/multica-ai/andrej-karpathy-skills
  - It has the four guidelines: Think Before Coding, Simplicity First, Surgical Changes, and Goal-Driven Execution. This skill rewords them.
  - Its EXAMPLES.md has longer before-and-after code examples.
- **Nick Saraev, "How The #1 AI Engineer in The World Actually Uses AI"**, Nov 5, 2026: https://youtu.be/3wCkFtIz88g
  - Chapters: plain English and short prompts; pictures beat long explanations; why he doesn't trust benchmarks; his weird model tests; building fixes (HackerTube); cheap filters, then Sonnet subagents; share the data, not the app; why he is polite to Claude.
  - The transcript couldn't be downloaded. The content comes from the chapter list and from write-ups that summarize the video.
- **Secondary write-ups**:
  - https://brycewatson.com/research/karpathy-ai-habits
  - https://www.mindstudio.ai/blog/karpathy-claude-code-workflow
  - https://kingy.ai/blog/hackertube-karpathy-claude-code/
