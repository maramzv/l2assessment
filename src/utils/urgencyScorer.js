/**
 * Urgency Scorer - Rule-based urgency signals
 *
 * Urgency is about business impact and time pressure, never about tone, message
 * length, punctuation, politeness, or the time of day the message was sent.
 * The LLM makes the main urgency call; these rules are (a) the fallback when the
 * AI is unavailable and (b) a safety net that never lets a critical issue be
 * downgraded (see resolveUrgency).
 */

// Unambiguous "something is broken for the business right now" signals.
const CRITICAL_PATTERNS = [
  /\b(production|prod|server|servers|site|website|app|api|service|database|db|system|checkout|platform)\b[^.!?\n]{0,30}\b(down|offline|unreachable|crashed|lost)\b/i,
  /\b(outage|data loss|lost (all )?(my |our )?data|breach|hacked|security incident)\b/i,
  /\bconnection (lost|failed)\b/i,
  /\b5\d\d (errors?|status)\b/i,
  /\bunauthori[sz]ed (charge|access|transaction)s?\b/i,
  /\b(charged|billed)( me)? (twice|two times|double)\b|\bdouble[- ]charged\b|\bcobrad[oa] dos veces\b/i,
  /\blosing (sales|money|revenue|customers)\b/i,
]

// Stated or implied time pressure / a customer who is blocked.
const ELEVATED_PATTERNS = [
  /\b(urgent|urgently|asap|immediately|emergency|right now|deadline)\b/i,
  /\b(can'?t|cannot|unable to|won'?t) (log ?in|sign ?in|access|load|pay|checkout|check out)\b/i,
  /\b(crash(es|ed|ing)?|not working|broken|error|failed|failing|timing out)\b/i,
  /\b(refund|chargeback|cancel(l?ation)?|charged|overcharged|payment)\b/i,
  /\b(today|tomorrow|tonight|by (monday|tuesday|wednesday|thursday|friday)|next billing date)\b/i,
]

/**
 * Rule-based urgency estimate from the message text alone.
 *
 * @param {string} message - The customer support message
 * @returns {"High"|"Medium"|"Low"}
 */
export function calculateUrgency(message) {
  if (CRITICAL_PATTERNS.some(p => p.test(message))) return "High"
  if (ELEVATED_PATTERNS.some(p => p.test(message))) return "Medium"
  return "Low"
}

/**
 * Combine the AI's urgency with the rule-based signals.
 *
 * - If the AI gave no valid urgency, use the rules.
 * - If the rules see a critical signal in a Technical/Billing message, never go below High,
 *   so one bad model answer cannot bury an outage. Praise or questions that merely mention a
 *   past outage are left to the AI.
 *
 * @param {string|null} aiUrgency - Urgency returned by the LLM
 * @param {string} category - The (validated) category
 * @param {string} message - The customer support message
 * @returns {"High"|"Medium"|"Low"}
 */
export function resolveUrgency(aiUrgency, category, message) {
  const rules = calculateUrgency(message)
  if (!["High", "Medium", "Low"].includes(aiUrgency)) return rules
  const operational = category === "Technical Problem" || category === "Billing Issue"
  if (operational && rules === "High") return "High"
  return aiUrgency
}
