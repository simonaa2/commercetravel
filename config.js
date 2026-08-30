// ===================================================
// YEAR 10 COMMERCE TRAVEL SCAFFOLD — CONFIGURATION
// ===================================================

const CONFIG = {
  // Google Apps Script Web App URL (from your setup):
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxJxATvvd-jUW5S8AAquDCZ2MBXqlNaIOWdIG-BesQeK5IUuDbyc_pSbe1k443E3NhM/exec',

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
    { name: 'Joshua Duffey', password: 'joshua5192' },
    { name: 'Tobias Filipek', password: 'tobias8374' },
    { name: 'Jasper Ghodosi', password: 'jasper6201' },
    { name: 'Charlie Jurd-Smith', password: 'charlie4093' },
    { name: 'Anthony Lattouf', password: 'anthony7182' },
    { name: 'Jacob Lattouf', password: 'jacob3510' },
    { name: 'Oliver Martin', password: 'oliver9024' },
    { name: 'Max Mirabello', password: 'max4831' },
    { name: 'Dominic Mobberley-Barreto', password: 'dominic5729' },
    { name: 'Noah Ntzeremes', password: 'noah8214' },
    { name: 'Patrick O\'Connor', password: 'patrick6392' },
    { name: 'Wachirawit (Shine) Sajjathitiyanond', password: 'shine7029' },
    { name: 'Jacob Salem', password: 'jacob5183' },
    { name: 'Luca Toffolo', password: 'luca4920' },
    { name: 'James Tzirtzilakis', password: 'james6304' },
    { name: 'William Tzirtzilakis', password: 'william1759' },
    { name: 'Kaiden Walker', password: 'kaiden3810' },
    { name: 'Jesper Whippy', password: 'jesper9240' },
    { name: 'Jane Doe', password: 'jane202' }
  ],

  // Fallback class code (only used if STUDENTS list is empty):
  CLASS_CODE: 'COMM10_2026',

  // Password for the teacher dashboard
  TEACHER_PASSWORD: 'Rhino123*',

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
