// Usage: node evals/run.mjs --mode legacy|new [--set main|holdout]
// Runs every case in evals/messages.mjs through the chosen triage logic and scores it.
import { writeFileSync } from 'node:fs'
import Groq from 'groq-sdk'

process.loadEnvFile('.env.local')
const arg = (name, fallback) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback)
const mode = arg('--mode', 'new')
const set = arg('--set', 'main') // main | holdout
const { cases } = await import(set === 'holdout' ? './messages-holdout.mjs' : './messages.mjs')
const groq = new Groq({ apiKey: process.env.VITE_GROQ_API_KEY })

async function analyze(message) {
  if (mode === 'legacy') {
    const { legacyCategorize, legacyUrgency, legacyAction } = await import('./legacy.mjs')
    const { category, reasoning } = await legacyCategorize(groq, message)
    return { category, urgency: legacyUrgency(message), action: legacyAction(category), reasoning, source: 'ai' }
  }
  const { analyzeMessage } = await import('../src/utils/llmHelper.js')
  const { getRecommendedAction } = await import('../src/utils/templates.js')
  const r = await analyzeMessage(message)
  return { ...r, action: getRecommendedAction(r.category, r.urgency) }
}

const results = []
for (const c of cases) {
  let r
  try {
    r = await analyze(c.message)
  } catch (e) {
    r = { category: 'ERROR', urgency: 'ERROR', action: '', reasoning: String(e.message), source: 'error' }
  }
  const catOk = c.category.includes(r.category)
  const urgOk = c.urgency.includes(r.urgency)
  results.push({ id: c.id, note: c.note, message: c.message, expected: { category: c.category, urgency: c.urgency }, got: r, catOk, urgOk })
  console.log(`${String(c.id).padStart(2)} ${catOk ? 'OK ' : 'BAD'} cat=${r.category.padEnd(18)} ${urgOk ? 'OK ' : 'BAD'} urg=${r.urgency.padEnd(6)} src=${r.source}  | ${c.note}`)
}

const n = results.length
const cat = results.filter(r => r.catOk).length
const urg = results.filter(r => r.urgOk).length
const missedHigh = results.filter(r => r.expected.urgency.length === 1 && r.expected.urgency[0] === 'High' && r.got.urgency !== 'High').length
console.log(`\n[${mode}/${set}] category correct: ${cat}/${n}   urgency correct: ${urg}/${n}   critical (High) messages missed: ${missedHigh}`)
writeFileSync(`evals/results-${set}-${mode}.json`, JSON.stringify({ mode, set, ranAt: new Date().toISOString(), summary: { n, cat, urg, missedHigh }, results }, null, 2))
