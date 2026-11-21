# 🎯 Year 10 Commerce Travel Scaffold — Setup Instructions

This repository contains the complete interactive **Travel Portfolio Scaffold** Web Application for Year 10 Commerce. It allows students to complete their travel consultant workbook online (covering destination selection, 7–10 day itineraries, budget calculators with contingency validation, Smartraveller due diligence, and emergency plan builders), autosaves their work locally, and allows them to submit their final dossiers directly to your class Google Sheet.

---

## 🛠️ Step 1: Set Up the Google Sheets Database

1. Create a new **Google Sheet** on your Google Drive and name it (e.g., `Year 10 Commerce Travel Submissions`).
2. In the top menu of your Google Sheet, click **Extensions** ➔ **Apps Script**.
3. Delete any default code in the editor, and copy-paste the entire contents of **[`google_script.js`](google_script.js)** into the editor.
4. Click the **Save** disk icon.

---

## 🚀 Step 2: Deploy the Google Apps Script Web App

To allow students' web browsers to send data to your Google Sheet:
1. In the Apps Script editor, click **Deploy** ➔ **New deployment** (top-right).
2. Click the gear icon next to "Select type" and select **Web app**.
3. Set the configuration details:
   * **Description:** `Year 10 Commerce Travel Submissions Controller`
   * **Execute as:** `Me (your email)`
   * **Who has access:** **`Anyone`** *(⚠️ Note: This must be set to "Anyone" so that student submissions are not blocked by Google login prompts. The script is secured via internal parameters).*
4. Click **Deploy**.
5. Copy the **Web App URL** provided (it will end with `/exec`). You will need this URL in Step 3.

---

## ⚙️ Step 3: Configure Student Credentials & Backend URL

1. Open the file **[`config.js`](config.js)** in your code or text editor.
2. Replace `'YOUR_APPS_SCRIPT_URL_HERE'` with the Web App URL you copied in Step 2:
   ```javascript
   SCRIPT_URL: 'https://script.google.com/macros/s/.../exec',
   ```
3. *(Optional)* Change the due date or change the teacher dashboard password (default is `'travel10'`).
4. Save and close `config.js`.

---

## 🌐 Step 4: Host on GitHub Pages

Since your repository is at `https://github.com/simonaa2/commercetravel`:
1. Push all files (`index.html`, `scaffold.html`, `style.css`, `app.js`, `config.js`, `teacher.html`, `teacher.js`, and `README.md`) to your GitHub repository.
2. In your GitHub repository webpage, click **Settings** ➔ **Pages** (on the left menu).
3. Under **Build and deployment**:
   * Set **Source** to `Deploy from a branch`.
   * Set the branch to `main` (or `master`) and the folder to `/ (root)`.
4. Click **Save**.
5. Give it 1–2 minutes, then refresh the settings page. You will see your live link:
   `https://simonaa2.github.io/commercetravel/`
   
**Share this link with your students!**

---

## 👩‍🏫 Step 5: Monitoring Student Work (Teacher Dashboard)

1. Open your live hosted page (e.g. `https://simonaa2.github.io/commercetravel/`).
2. Click the link at the very bottom: **"Teacher dashboard ➔"** (or append `/teacher.html` to the URL).
3. Enter the dashboard password (default: `travel10`).
4. Here you can:
   * See how many students have submitted.
   * Search students by name or destination.
   * Click a student's card to expand their entire dossier, including their flight and accommodation quotes, an itemised budget table, Smartraveller notes, and emergency plans.
   * Click **Export CSV** to download a spreadsheet of all student submissions for easy grading!
