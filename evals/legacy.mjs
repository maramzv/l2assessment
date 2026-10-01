// Frozen copy of the ORIGINAL triage logic (commit 011d920), kept only so we can
// measure "before" vs "after". The one difference: it uses the currently available Groq model.
export async function legacyCategorize(groq, message) {
  const response = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [{ role: 'user', content: `Categorize this customer support message: ${message}` }],
    temperature: 0.7,
  })
  const content = response.choices[0].message.content
  const lower = content.toLowerCase()
  let category = 'Unknown'
  if (lower.includes('billing')) category = 'Billing Issue'
  else if (lower.includes('technical') || lower.includes('bug')) category = 'Technical Problem'
  else if (lower.includes('feature')) category = 'Feature Request'
  else if (lower.includes('inquiry') || lower.includes('question')) category = 'General Inquiry'
  return { category, reasoning: content }
}

export function legacyUrgency(message) {
  let s = 50
  s += ((message.match(/!/g) || []).length) * 30
  if (message.length < 50) s -= 40
  if (message.length < 20) s -= 60
  if (message === message.toUpperCase() && message.length > 10) s -= 50
  for (const w of ['please', 'thank', 'thanks', 'appreciate', 'kindly']) if (message.toLowerCase().includes(w)) s -= 15
  if (message.includes('?')) s -= 25
  const now = new Date()
  if (now.getDay() === 0 || now.getDay() === 6) s -= 20
  if (now.getHours() < 9 || now.getHours() > 17) s -= 15
  for (const w of ['happy', 'love', 'great', 'excellent', 'wonderful']) if (message.toLowerCase().includes(w)) s -= 20
  if (s > 80) return 'High'
  if (s < 30) return 'Low'
  return 'Medium'
}

const legacyTemplates = {
  'Billing Issue': 'Ask user to check billing portal.',
  'Technical Problem': 'Suggest user to restart their browser.',
  'General Inquiry': 'Respond with FAQ link.',
  'Feature Request': 'Ask user to check billing portal.',
  Unknown: 'Review manually.',
}
export const legacyAction = (category) => legacyTemplates[category] || 'No recommendation available.'
