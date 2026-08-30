// ===================================================
// YEAR 10 COMMERCE TRAVEL SCAFFOLD — CONFIGURATION
// ===================================================

const CONFIG = {
  // The class code students must enter to log in
  CLASS_CODE: 'COMM10_2026',

  // Due Date (Friday 18th September 2026 by 3:30pm)
  // Used for the countdown timer
  DUE_DATE: '2026-09-18T15:30:00',

  // Password for the teacher dashboard
  TEACHER_PASSWORD: 'travel10',

  // Google Apps Script Web App URL for submissions
  // Once deployed, paste the URL ending in /exec here
  SCRIPT_URL: 'YOUR_APPS_SCRIPT_URL_HERE',

  // Outcomes assessed for reference
  OUTCOMES: [
    { code: 'COM5-1', desc: 'Applies consumer, financial, economic, business, legal, political and employment concepts and terminology in a variety of contexts.' },
    { code: 'COM5-4', desc: 'Analyses key factors affecting decisions.' },
    { code: 'COM5-5', desc: 'Evaluates options for solving problems and issues.' },
    { code: 'COM5-6', desc: 'Develops and implements plans designed to achieve goals.' },
    { code: 'COM5-7', desc: 'Researches and assesses information using a variety of sources.' },
    { code: 'COM5-8', desc: 'Explains information using a variety of forms.' }
  ]
};

// Export if in Node context (for testing), otherwise keep global for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
