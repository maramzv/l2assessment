# Relay AI Customer Inbox Triage: Assessment Write-up

**Goal of the product:** let a small support team handle more volume without more staff. That only works if the tool (1) routes messages to the right place and (2) never lets an urgent one sit in the queue. Every finding below is judged against those two things.

## What I tested

I ran 28 customer messages through the app: the 8 in `sample-messages.json`, 8 more I added (angry all-caps, negation, polite-but-urgent, Spanish, etc.), and a separate set of 12 written *after* the fix with their expected answers fixed in advance (`evals/messages-holdout.mjs`). A "correct" answer is whatever a support lead would accept; ambiguous messages list more than one acceptable answer.

Reproduce everything with:

```bash
node evals/run.mjs --mode legacy --set main      # original logic
node evals/run.mjs --mode new    --set main
node evals/run.mjs --mode legacy --set holdout
node evals/run.mjs --mode new    --set holdout
```

## Finding 0: the app was not using the AI at all

The model the app asked for (`llama-3.3-70b-versatile`) has been retired by Groq. Every call failed, and the `catch` block silently swapped in keyword-based mock answers that look exactly like real ones. A support team would never know. I switched to a current model (`openai/gpt-oss-120b`) before doing any other testing, so everything below compares the *real* AI before and after.

## Top 3 areas for improvement

### 1. Urgency scoring is backwards (highest business impact)
`urgencyScorer.js` scores style, not impact: short messages (-40/-100), ALL CAPS (-50), "please/thanks" (-15 each), a question mark (-25), nights and weekends (-15/-20, based on the *reader's* clock), and each `!` adds +30. It never looks for outages, charges or deadlines.
- "Server down now" and "Database connection lost" → **Low**
- A thank-you with exclamation marks → **High**
- "I WAS CHARGED TWICE AND I WANT MY MONEY BACK NOW" → **Low**

**Why it matters:** missed outages and double charges are the most expensive mistakes a triage tool can make, and false High alerts train agents to ignore the tag.
**Fix:** the LLM judges urgency from business impact and time pressure, with an explicit rubric that tells it to ignore tone, caps, punctuation, politeness and length. A small rule layer (`resolveUrgency`) never lets a *Technical/Billing* message with an unambiguous critical signal (e.g. "server down", "charged twice") fall below High, so one bad model answer can't bury an outage.

### 2. Category detection is fragile, and failures are silent
The prompt was just "Categorize this message" with no list of categories. The code then searched the model's free-text reply for words like "billing" or "technical", so the answer depended on the model's phrasing (a reply saying "this is *not* a billing issue" is filed as Billing). Anything without a magic word became `Unknown`. Failures (like the retired model) fell back to fake answers with no warning.
**Fix:** one structured call (JSON mode) with the allowed categories defined, a validated response, and `source: 'fallback'` plus a visible yellow warning in the UI when the AI could not be reached. I also made the Groq client lazy, so a missing API key no longer crashes the app on load. Added a `Customer Feedback` category so praise is not routed as a question.

### 3. Recommended actions and escalation are wrong or generic
- Every Technical Problem got "Suggest user to restart their browser", even for a server outage.
- Feature Request got "Ask user to check billing portal" (copy-paste error).
- `shouldEscalate` returned true for any message over 100 characters, regardless of urgency.

**Fix:** actions written per category, with faster owner-specific actions when urgency is High (on-call engineer within 15 minutes; billing lead to verify and refund). `shouldEscalate` now follows urgency.

## Results

| Set | Version | Category correct | Urgency correct | Critical (High) messages missed |
|---|---|---|---|---|
| Main (16) | Original | 11/16 | 6/16 | 3 of 3 |
| Main (16) | New | 16/16 | 16/16 | 0 |
| Held-out (12) | Original | 4/12 | 6/12 | 2 of 2 |
| Held-out (12) | New | 12/12 | 11/12 | 0 |

The original's urgency also depends on the clock: it subtracts points before 9am, after 5pm and on weekends, so these numbers were taken on a weekday afternoon and would be worse at night. Full per-message output is in `evals/results-*.json`.

## Honest limitations

- **The main set is not a fair test of the fix.** I wrote it while looking at the problems, and a few of the critical-signal patterns ("losing sales", Spanish "cobrada dos veces") were added with those messages in view. The held-out set is the better evidence.
- **One miss remains:** `URGENT!!! WHEN WILL YOU ADD DARK MODE???` came back Medium instead of Low. The model was swayed by the word "URGENT". I left it unfixed on purpose rather than tune the prompt to the held-out set.
- **Small sample, single run.** 28 messages, one run each, and the LLM is not deterministic (temperature 0.2 in the new version, 0.7 in the original). This shows a large improvement, not a precise accuracy figure.
- **The rule layer is English-and-Spanish keywords only.** The AI handles other languages; the safety net does not.

## Not done (next steps)

1. **The API key is still exposed in the browser** (`dangerouslyAllowBrowser`). Before any real deployment, move the Groq call to a small backend and keep the key server-side.
2. **Feedback loop:** let agents correct a category or urgency in the UI and use those corrections as new test cases.
3. **Routing to named teams or people** instead of a text recommendation, which is the actual "route" in Relay AI's pitch.
4. **Pre-existing lint errors** in `DashboardPage`, `HistoryPage` and `HomePage` (setState inside effects), untouched here.

## Files changed

- `src/utils/llmHelper.js`: structured prompt, JSON parsing, `analyzeMessage`, fallback flag, lazy client
- `src/utils/urgencyScorer.js`: impact-based rules and `resolveUrgency`
- `src/utils/templates.js`: new actions, `Customer Feedback`, urgency-aware actions, escalation
- `src/pages/AnalyzePage.jsx`: uses `analyzeMessage`, shows the fallback warning
- `evals/`: test messages, frozen original logic, runner and saved results
