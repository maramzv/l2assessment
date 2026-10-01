// Evaluation set: customer messages with the answers a human support lead would expect.
// `category` / `urgency` list every acceptable answer (some messages are genuinely ambiguous).
export const cases = [
  { id: 1,  note: 'Short outage report',           message: 'Database connection lost',                                                              category: ['Technical Problem'],                urgency: ['High'] },
  { id: 2,  note: 'Praise with exclamation marks', message: 'Thank you so much! Your team has been incredibly helpful and I really appreciate the fast response to my question earlier today!', category: ['Customer Feedback'], urgency: ['Low'] },
  { id: 3,  note: 'Feature request',               message: 'Could you add an export to CSV feature? Would be really useful for my monthly reports.', category: ['Feature Request'],                  urgency: ['Low'] },
  { id: 4,  note: 'Billing + technical hybrid',    message: "My payment failed and now I can't access the dashboard. Is there a bug or do I need to update my credit card?", category: ['Billing Issue', 'Technical Problem'], urgency: ['Medium', 'High'] },
  { id: 5,  note: 'Minimal input',                 message: 'hi',                                                                                    category: ['General Inquiry', 'Unknown'],       urgency: ['Low'] },
  { id: 6,  note: 'Urgent short message',          message: 'Server down now',                                                                       category: ['Technical Problem'],                urgency: ['High'] },
  { id: 7,  note: 'Rambling, no real issue',       message: "Hi! I was just browsing through your website and noticed you have a really nice design! I especially like the color scheme and the way you've organized the navigation menu! Everything looks so professional and clean! Just wanted to share my positive feedback!", category: ['Customer Feedback', 'General Inquiry'], urgency: ['Low'] },
  { id: 8,  note: 'General question',              message: 'What are your business hours?',                                                         category: ['General Inquiry'],                  urgency: ['Low'] },
  { id: 9,  note: 'Angry all-caps double charge',  message: 'I WAS CHARGED TWICE AND I WANT MY MONEY BACK NOW',                                      category: ['Billing Issue'],                    urgency: ['Medium', 'High'] },
  { id: 10, note: 'Negation trap',                 message: 'This is not a billing issue, but the login page crashes every time I try to sign in.',  category: ['Technical Problem'],                urgency: ['Medium', 'High'] },
  { id: 11, note: 'Plan upgrade question',         message: 'Can I upgrade my subscription to the pro plan?',                                        category: ['Billing Issue', 'General Inquiry'], urgency: ['Low'] },
  { id: 12, note: 'Customer-facing outage',        message: "URGENT: all our customers are seeing 500 errors at checkout and we're losing sales every minute.", category: ['Technical Problem'],       urgency: ['High'] },
  { id: 13, note: 'Polite but time-sensitive',     message: 'Please cancel my subscription before the next billing date tomorrow, thank you.',       category: ['Billing Issue'],                    urgency: ['Medium', 'High'] },
  { id: 14, note: 'Feature request, polite',       message: 'I would love a dark mode option. It would be much easier on my eyes at night.',         category: ['Feature Request'],                  urgency: ['Low'] },
  { id: 15, note: 'Cosmetic bug, no rush',         message: 'The export button is slightly misaligned on mobile. No rush at all!',                  category: ['Technical Problem'],                urgency: ['Low'] },
  { id: 16, note: 'Non-English billing',           message: 'Mi cuenta fue cobrada dos veces este mes, por favor ayuda.',                            category: ['Billing Issue'],                    urgency: ['Medium', 'High'] },
]
