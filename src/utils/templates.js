/**
 * Recommendation Templates - Maps category (and urgency) to a recommended action
 */

const actionTemplates = {
  "Billing Issue": "Route to the billing team to review the customer's account and charges.",
  "Technical Problem": "Collect steps to reproduce plus browser/device details and route to technical support.",
  "General Inquiry": "Answer directly or reply with the relevant FAQ link.",
  "Feature Request": "Log it in the feature-request backlog and thank the customer for the idea.",
  "Customer Feedback": "Send a short thank-you reply and share the feedback with the team.",
  "Unknown": "Review manually."
}

// High-urgency messages get a faster, owner-specific action instead of the standard one.
const highUrgencyTemplates = {
  "Billing Issue": "Escalate to the billing lead now: verify the charge and refund immediately if it is a duplicate or unauthorized.",
  "Technical Problem": "Escalate to the on-call engineer immediately and acknowledge the customer within 15 minutes.",
}

/**
 * Get recommended action for a given category
 *
 * @param {string} category - The message category
 * @param {string} urgency - The urgency level
 * @returns {string} - Recommended next step
 */
export function getRecommendedAction(category, urgency) {
  if (urgency === "High" && highUrgencyTemplates[category]) {
    return highUrgencyTemplates[category]
  }
  return actionTemplates[category] || "No recommendation available."
}

/**
 * Get all available categories
 *
 * @returns {string[]} - List of categories
 */
export function getAvailableCategories() {
  return Object.keys(actionTemplates)
}

/**
 * Determines if message should be escalated
 *
 * @param {string} category - The message category
 * @param {string} urgency - The urgency level
 * @returns {boolean} - Whether to escalate
 */
export function shouldEscalate(category, urgency) {
  return urgency === "High"
}
