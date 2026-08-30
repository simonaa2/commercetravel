// ===================================================
// YEAR 10 COMMERCE TRAVEL SCAFFOLD — CONFIGURATION
// ===================================================

const CONFIG = {
  // Google Apps Script Web App URL (from your setup):
  SCRIPT_URL: 'YOUR_APPS_SCRIPT_URL_HERE',

  // Due Date (Friday 18th September 2026 by 3:30pm)
  // Used for the countdown timer
  DUE_DATE: '2026-09-18T15:30:00',

  // -----------------------------------------------
  // STUDENT ROSTER
  // Add each student as: { name: 'Full Name', password: 'password' }
  // Name must match exactly what they type on the login page.
  // Passwords can be anything — e.g. first name + last 2 digits of DOB.
  // Leave the array empty [] to use the fallback CLASS_CODE system instead.
  // -----------------------------------------------
  STUDENTS: [
    { name: 'John Smith',       password: 'john101' },
    { name: 'Jane Doe',         password: 'jane202' },
    { name: 'Alex Johnson',     password: 'alex303' }
  ],

  // Fallback class code (only used if STUDENTS list is empty):
  CLASS_CODE: 'COMM10_2026',

  // Password for the teacher dashboard
  TEACHER_PASSWORD: 'travel10',

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
