# Big data jobs: cheap filters first, then a cheaper model

Use this when a task means reading or judging many items, such as comments, reviews, logs, emails, rows, or documents.

## The HackerTube example

| Stage | What happened | Done by |
|---|---|---|
| Get the data | About 43M Hacker News comments, covering about 20 years, from a public dataset | Opus, through code |
| Cheap filters | Keep comments that have a YouTube link and at least 100 characters of the commenter's own text. Keep videos mentioned by at least 3 people in at least 3 different months. Keep at most 20 mentions per video, favoring different people. | Code |
| Label | Each remaining mention gets one label: recommendation, strong recommendation, neutral reference, joke, or criticism. The story title goes in as context. The model also wrote short summaries and topic categories. | Sonnet subagents in a Claude Code workflow |
| Score | Number of different months with a recommendation, plus half the number of different months with a strong recommendation | Code |
| Result | About 40K recommending comments, which gave 6,454 videos in about 150 topics | |
| Cost | About 504M input tokens (about 90% cached) and 7.6M output tokens. Over 90% went to labeling. The app and the deploy took about 1M Opus tokens. | |

## The recipe

1. **Get the raw data the cheap way.** Look for a public dump or an API before you write a scraper. Save the data to disk once.
2. **Filter with code.** Use regex, URL matching, length limits, deduplication, language, date range, and count thresholds. Code filters are free and fast, so use as many as make sense. Print the count after each filter so the user can see how much each one removed.
3. **Look before you label.** Show 20 random items that passed the filters. If many are obvious junk, add another code filter. Every item that code removes is one the model doesn't have to read.
4. **Estimate the cost.** Input is about items × (prompt tokens + item tokens). Output is about items × label tokens. Put the fixed instructions first so they get cached. If the run is large, tell the user the estimate and get a yes before you start.
5. **Label with a cheaper model.** Use a fixed set of labels. Give the model the context it needs, such as the thread title. Ask for structured output, for example JSON with the label and a short reason. Run it in parallel batches.
   - Inside Claude Code, use a workflow or a set of subagents on a cheaper model. Karpathy did this on his subscription.
   - With an API key, a script that uses the batch API costs less for very large runs.
   - The strongest model plans and writes the code. It doesn't do the per-item work.
6. **Check the labels.** Print how many items got each label, plus 30 random labeled items with their reasons. If the labels are wrong, fix the prompt and run it again. In the final output, say that a model made the labels and no person checked them.
7. **Score with a simple formula.** Use a formula a person can read in one line, and avoid rankings nobody can explain.
8. **Save every stage to disk.** Keep raw, filtered, labeled, and scored data as separate files. Then a change to step 5 doesn't mean redoing steps 1 and 2.
9. **Build the app on top of the final file.** The app is a thin wrapper around the data.
10. **Export the data.** Make a zip or a few JSON or CSV files. Add a README that describes the fields and includes the prompt to rebuild the app. This is the part worth sharing.
