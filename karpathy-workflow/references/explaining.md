# Explaining things to someone who doesn't read the code

- [Plain words (ASD-STE100 style)](#plain-words-asd-ste100-style)
- [Before and after](#before-and-after)
- [The picture ladder](#the-picture-ladder)
- [Practical notes](#practical-notes)

## Plain words (ASD-STE100 style)

ASD-STE100, "Simplified Technical English," is a controlled language made for aircraft maintenance manuals, where a misread sentence can be dangerous. Karpathy suggests asking models to write in it when their output is hard to follow. He suggests following it about 80% of the way, because strict compliance reads stiffly. These are the rules worth keeping:

- One idea per sentence. Keep instructions under about 20 words and descriptions under about 25.
- Use active voice: "The script deletes old rows," not "Old rows are deleted."
- Write instructions as commands, such as "Run the server." Put sequences in numbered steps.
- Use common words with one meaning each. Pick one name for a thing and keep using it. Say "worker" every time, not "worker," "job runner," and "processor."
- Put the condition first: "If the build fails, check the log."
- Explain a technical term in a few words the first time you use it, or use a plainer word.
- Keep paragraphs short, about six sentences at most. Leave out idioms and filler.

## Before and after

Before:
> The ingestion layer leverages a multi-stage heuristic pre-filtering pipeline to substantially reduce the candidate set prior to LLM-based classification, which is then aggregated via a recency-weighted scoring function.

After:
> The program reads all the comments. First, simple code rules remove most of them. Then a model labels each remaining comment. Then the program counts the good labels for each video. Videos with more good labels rank higher.

## Pictures

The default picture is an explainer sheet: a PNG laid out like a technical drawing, with diagrams, charts, and annotated tables. See [visual-explainers.md](visual-explainers.md). Use the plain-word rules above for every label, title, and note on the sheet.

Two other formats are available if the user asks for them:
- **Interactive page:** the sheet's `.html` file already has chart tooltips. For more, such as stepping through an algorithm or filtering a table, add a small script to the fragment.
- **Explainer video:** Karpathy is most excited about this format: a short 3Blue1Brown-style animation with narration. Make one only when the user wants it and video tools are available.

Code is cheap now. A one-off picture that explains one thing and then gets thrown away is a good use of it.

## Practical notes

- Give the answer first, then the explanation.
- Use the user's real data in examples, not foo and bar.
- Show the thing, such as a screenshot or a plotted result, before you describe it.
- Save generated explainers as local files and give the full path. Don't upload or publish them.
