// ===================================================
// TEACHER DASHBOARD — teacher.js
// ===================================================

let allSubmissions = [];
let currentSort = 'time';
let teacherPassword = '';

// ===== LOGIN =====
function teacherLogin() {
  const pw = document.getElementById('teacher-pw').value;
  if (!pw) { showTlError('Please enter the password.'); return; }

  if (pw !== CONFIG.TEACHER_PASSWORD) {
    showTlError('Incorrect password. Please try again.');
    return;
  }

  teacherPassword = pw;
  document.getElementById('teacher-login').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  
  // Link to Sheet if URL is configured
  const sheetLink = document.getElementById('sheet-link');
  if (CONFIG.SCRIPT_URL && CONFIG.SCRIPT_URL !== 'YOUR_APPS_SCRIPT_URL_HERE') {
    sheetLink.style.display = 'inline-flex';
    // Attempt to open the sheet spreadsheet URL itself if we can parse it from SCRIPT_URL,
    // or just show the button (we will link to SCRIPT_URL or keep placeholder)
    sheetLink.href = CONFIG.SCRIPT_URL; 
  }
  
  loadSubmissions();
}

function teacherLogout() {
  teacherPassword = '';
  document.getElementById('teacher-login').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('teacher-pw').value = '';
}

function showTlError(msg) {
  const el = document.getElementById('tl-error');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('teacher-login').style.display !== 'none') {
    teacherLogin();
  }
});

// ===== LOAD SUBMISSIONS FROM APPS SCRIPT =====
async function loadSubmissions() {
  const container = document.getElementById('students-container');
  container.innerHTML = '<div class="dash-loading"><div class="spinner"></div><span>Loading submissions…</span></div>';

  if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
    // If not connected, show dummy/instructions details
    showMockData();
    return;
  }

  try {
    const url = `${CONFIG.SCRIPT_URL}?password=${encodeURIComponent(teacherPassword)}&action=read`;
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      if (result.error === 'Unauthorized') {
        container.innerHTML = '';
        alert('Incorrect password validation. Please try again.');
        teacherLogout();
      } else {
        container.innerHTML = `<div class="dash-empty"><div class="dash-empty-icon">⚠️</div><p>${result.error || 'Unknown error'}</p></div>`;
      }
      return;
    }

    allSubmissions = result.submissions || [];
    renderDashboard();

  } catch (err) {
    container.innerHTML = `
      <div class="dash-empty">
        <div class="dash-empty-icon">🔌</div>
        <p>Could not connect to Google Sheet backend.</p>
        <p style="font-size:0.8rem;margin-top:0.5rem;color:var(--text-dim)">${err.message}</p>
        <button class="dash-btn dash-btn-outline" style="margin-top:1rem;" onclick="showMockData()">Load Mock Sample Data (Offline Mode)</button>
      </div>`;
  }
}

// ===== RENDER =====
function renderDashboard() {
  updateStats();
  renderStudents(allSubmissions);
}

function updateStats() {
  const total = allSubmissions.length;
  
  // Submissions today
  const today = allSubmissions.filter(s => {
    if (!s.timestamp) return false;
    const d = new Date(s.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  // Percentage under $10,000 budget
  let underCount = 0;
  allSubmissions.forEach(s => {
    try {
      if (s['budget-serialized']) {
        const budget = JSON.parse(s['budget-serialized']);
        const base = budget.items.reduce((sum, item) => sum + (item.audCost || 0), 0);
        const contingency = budget.contingencyOverride !== undefined ? budget.contingencyOverride : (base * 0.08);
        const grand = base + contingency;
        if (grand <= 10000) underCount++;
      } else {
        // Fallback checks
        underCount++;
      }
    } catch(e) {
      underCount++;
    }
  });
  
  const underPct = total > 0 ? Math.round((underCount / total) * 100) : 0;

  // Last submission timestamp
  const last = allSubmissions.length
    ? new Date(allSubmissions[allSubmissions.length - 1].timestamp).toLocaleString('en-AU', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})
    : '—';

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-today').textContent = today;
  document.getElementById('stat-under-budget').textContent = `${underPct}%`;
  document.getElementById('stat-last').textContent = last;
}

function sortBy(field) {
  currentSort = field;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`sort-${field}`).classList.add('active');
  filterStudents();
}

function filterStudents() {
  const query = document.getElementById('dash-search').value.toLowerCase();
  let filtered = allSubmissions.filter(s =>
    (s.studentName || '').toLowerCase().includes(query) ||
    (s['dest-country'] || '').toLowerCase().includes(query)
  );
  if (currentSort === 'name') {
    filtered.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
  } else {
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  renderStudents(filtered);
}

function renderStudents(submissions) {
  const container = document.getElementById('students-container');

  if (submissions.length === 0) {
    container.innerHTML = `
      <div class="dash-empty">
        <div class="dash-empty-icon">📭</div>
        <p>No student submissions found.</p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="students-grid">${submissions.map((s, i) => studentCard(s, i)).join('')}</div>`;
}

function studentCard(s, idx) {
  const name = s.studentName || 'Unknown';
  const initials = name.charAt(0).toUpperCase();
  const time = s.timestamp ? new Date(s.timestamp).toLocaleString('en-AU', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Unknown time';
  const dest = s['dest-country'] || 'No Destination Selected';

  // Completion tags
  const fields = [
    { key: 'dest-reason',             label: 'Profile Justification' },
    { key: 'itinerary-serialized',    label: 'Itinerary Data' },
    { key: 'budget-serialized',       label: 'Budget Spreadsheet' },
    { key: 'ins-justification',       label: 'Insurance Sourcing' },
    { key: 'em-step1',                label: 'Crisis Action Plan' }
  ];

  const tags = fields.map(f => {
    let filled = false;
    if (f.key === 'itinerary-serialized') {
      try {
        const itin = JSON.parse(s[f.key]);
        filled = Object.keys(itin).length > 5;
      } catch(e) {}
    } else if (f.key === 'budget-serialized') {
      try {
        const b = JSON.parse(s[f.key]);
        filled = b.items && b.items.length > 0;
      } catch(e) {}
    } else {
      filled = s[f.key] && s[f.key].trim().length > 10;
    }
    return `<span class="sc-tag ${filled ? 'filled' : 'empty'}">${f.label}</span>`;
  }).join('');

  return `
    <div class="student-card" id="scard-${idx}" onclick="toggleCard(${idx})">
      <div class="sc-card-header">
        <div class="sc-avatar">${initials}</div>
        <div>
          <div class="sc-name">${escHtml(name)}</div>
          <div class="sc-meta">${time} · ${dest}</div>
        </div>
        <div class="sc-expand-icon">▼</div>
      </div>
      <div class="sc-preview">${tags}</div>
      <div class="sc-detail" onclick="event.stopPropagation()">${renderDetail(s)}</div>
    </div>`;
}

function toggleCard(idx) {
  const card = document.getElementById(`scard-${idx}`);
  card.classList.toggle('expanded');
}

function renderDetail(s) {
  // Parse itinerary sub-structure
  let itineraryHtml = '<p class="df-value empty">No itinerary planned</p>';
  if (s['itinerary-serialized']) {
    try {
      const itin = JSON.parse(s['itinerary-serialized']);
      const duration = parseInt(s['trip-duration']) || 7;
      let rowsHtml = '';
      for (let i = 1; i <= duration; i++) {
        rowsHtml += `
          <tr>
            <td><strong>Day ${i}</strong></td>
            <td>${escHtml(itin[`itinerary-day${i}-morning`] || '')}</td>
            <td>${escHtml(itin[`itinerary-day${i}-afternoon`] || '')}</td>
            <td>${escHtml(itin[`itinerary-day${i}-evening`] || '')}</td>
            <td>${escHtml(itin[`itinerary-day${i}-overnight`] || '')}</td>
            <td style="text-align:center;">${itin[`itinerary-day${i}-cultural`] === 'true' ? '✅' : '—'}</td>
          </tr>
        `;
      }
      itineraryHtml = `
        <table class="detail-table">
          <thead>
            <tr>
              <th style="width:60px;">Day</th>
              <th>Morning Plan</th>
              <th>Afternoon Activity</th>
              <th>Evening Plan</th>
              <th>Stay Overnight</th>
              <th style="width:60px; text-align:center;">Cultural</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
    } catch(e) {
      itineraryHtml = `<p class="df-value empty">Error parsing itinerary data: ${e.message}</p>`;
    }
  }

  // Parse budget items
  let budgetHtml = '<p class="df-value empty">No budget items entered</p>';
  let grandTotalAUD = 0;
  if (s['budget-serialized']) {
    try {
      const budget = JSON.parse(s['budget-serialized']);
      const rate = budget.exchangeRate || 1;
      const cur = budget.currencyCode || 'USD';
      let rowsHtml = '';
      let baseTotal = 0;
      
      (budget.items || []).forEach(item => {
        const itemAud = item.isAUDDirect ? item.audCost : (item.foreignCost / rate);
        baseTotal += itemAud;
        rowsHtml += `
          <tr>
            <td>${escHtml(item.category)}</td>
            <td>${escHtml(item.description)}</td>
            <td>${item.isAUDDirect ? '—' : (item.foreignCost.toFixed(2) + ' ' + cur)}</td>
            <td>${item.isAUDDirect ? '1.00' : rate.toFixed(4)}</td>
            <td>$${itemAud.toFixed(2)} AUD</td>
          </tr>
        `;
      });
      
      const contingency = budget.contingencyOverride !== undefined ? budget.contingencyOverride : (baseTotal * 0.08);
      grandTotalAUD = baseTotal + contingency;
      
      rowsHtml += `
        <tr style="border-top:2px solid var(--border-light); font-weight:bold;">
          <td colspan="4" style="text-align:right;">Base Expenses:</td>
          <td>$${baseTotal.toFixed(2)} AUD</td>
        </tr>
        <tr style="font-weight:bold;">
          <td colspan="4" style="text-align:right;">Contingency Fund Buffer:</td>
          <td>$${contingency.toFixed(2)} AUD</td>
        </tr>
        <tr style="font-weight:bold; color:var(--teal); font-size:0.9rem;">
          <td colspan="4" style="text-align:right;">Grand Total:</td>
          <td>$${grandTotalAUD.toFixed(2)} AUD</td>
        </tr>
      `;

      budgetHtml = `
        <table class="detail-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Foreign Cost</th>
              <th>Exchange Rate</th>
              <th>AUD Cost</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
    } catch(e) {
      budgetHtml = `<p class="df-value empty">Error parsing budget items: ${e.message}</p>`;
    }
  }

  // Determine budget compliance text/style
  const isCompliant = grandTotalAUD <= 10000;
  const complianceHtml = grandTotalAUD > 0 
    ? `<span style="color: ${isCompliant ? 'var(--green)' : 'var(--red)'}; font-weight:bold;">
        $${grandTotalAUD.toFixed(2)} AUD (${isCompliant ? 'Under Budget' : 'BUDGET EXCEEDED'})
       </span>`
    : '<span class="df-value empty">No budget calculations</span>';

  return `
    <div class="detail-section">
      <div class="detail-section-title">✈️ Part A: Destination &amp; Comparative Quotes</div>
      <div class="detail-grid">
        <div class="detail-field">
          <div class="df-label">Destination Country</div>
          <div class="df-value">${escHtml(s['dest-country'] || 'None')}</div>
        </div>
        <div class="detail-field">
          <div class="df-label">Type of Tourism</div>
          <div class="df-value">${escHtml(s['tourism-type'] || 'None')}</div>
        </div>
        <div class="detail-field span-all">
          <div class="df-label">Suitability Justification</div>
          <div class="df-value">${escHtml(s['dest-reason'] || 'No justification entered')}</div>
        </div>
        
        <div class="detail-field span-all">
          <div class="df-label">7-10 Day Itinerary Table</div>
          ${itineraryHtml}
        </div>

        <div class="detail-field">
          <div class="df-label">Flight Option 1 (Selected)</div>
          <div class="df-value">
            ${escHtml(s['flight1-airline'] || '—')} (${escHtml(s['flight1-number'] || '—')})<br/>
            Baggage: ${escHtml(s['flight1-baggage'] || '—')}<br/>
            Price: $${escHtml(s['flight1-price'] || '0')} AUD<br/>
            Ref: <a href="${escHtml(s['flight1-link'] || '#')}" target="_blank" style="color:var(--teal); font-size:0.75rem;">Link / Screenshot</a>
          </div>
        </div>
        <div class="detail-field">
          <div class="df-label">Flight Option 2</div>
          <div class="df-value">
            ${escHtml(s['flight2-airline'] || '—')} (${escHtml(s['flight2-number'] || '—')})<br/>
            Baggage: ${escHtml(s['flight2-baggage'] || '—')}<br/>
            Price: $${escHtml(s['flight2-price'] || '0')} AUD<br/>
            Ref: <a href="${escHtml(s['flight2-link'] || '#')}" target="_blank" style="color:var(--teal); font-size:0.75rem;">Link / Screenshot</a>
          </div>
        </div>
        <div class="detail-field span-all">
          <div class="df-label">Flight Selection Reason</div>
          <div class="df-value">${escHtml(s['flight-selection-reason'] || 'No reason entered')}</div>
        </div>

        <div class="detail-field">
          <div class="df-label">Accommodation Option 1</div>
          <div class="df-value">
            ${escHtml(s['acc1-name'] || '—')}<br/>
            Location: ${escHtml(s['acc1-location'] || '—')}<br/>
            Nightly Rate: $${escHtml(s['acc1-rate'] || '0')} AUD<br/>
            Ref: <a href="${escHtml(s['acc1-link'] || '#')}" target="_blank" style="color:var(--teal); font-size:0.75rem;">Link / Screenshot</a>
          </div>
        </div>
        <div class="detail-field">
          <div class="df-label">Accommodation Option 2</div>
          <div class="df-value">
            ${escHtml(s['acc2-name'] || '—')}<br/>
            Location: ${escHtml(s['acc2-location'] || '—')}<br/>
            Nightly Rate: $${escHtml(s['acc2-rate'] || '0')} AUD<br/>
            Ref: <a href="${escHtml(s['acc2-link'] || '#')}" target="_blank" style="color:var(--teal); font-size:0.75rem;">Link / Screenshot</a>
          </div>
        </div>
        <div class="detail-field span-all">
          <div class="df-label">Accommodation Selection Reason</div>
          <div class="df-value">${escHtml(s['acc-selection-reason'] || 'No reason entered')}</div>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">💰 Part B: Financial Budget Summary &amp; Excel</div>
      <div class="detail-grid">
        <div class="detail-field span-all">
          <div class="df-label">Draft Budget Calculator Breakdown</div>
          ${budgetHtml}
        </div>
        <div class="detail-field">
          <div class="df-label">Grand Total Spend (Budget Limit Check)</div>
          <div class="df-value">${complianceHtml}</div>
        </div>
        <div class="detail-field">
          <div class="df-label">External Spreadsheet Link (Excel/Google Sheets)</div>
          <div class="df-value">
            ${s['external-spreadsheet-url'] 
              ? `<a href="${escHtml(s['external-spreadsheet-url'])}" target="_blank" style="color:var(--gold); font-weight:bold;">🔗 Open Student's Spreadsheet Link</a>` 
              : '<span class="empty">Not submitted</span>'}
          </div>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">🔍 Part C: Smartraveller Due Diligence &amp; Laws</div>
      <div class="detail-grid">
        <div class="detail-field">
          <div class="df-label">DFAT Safety Advice Level</div>
          <div class="df-value" style="font-weight:600; color:var(--teal);">${escHtml(s['smartraveller-level'] || '—')}</div>
        </div>
        <div class="detail-field">
          <div class="df-label">Passport Validity Requirement</div>
          <div class="df-value">${escHtml(s['passport-validity'] || '—')}</div>
        </div>
        <div class="detail-field">
          <div class="df-label">Smartraveller Safety Warning 1</div>
          <div class="df-value">${escHtml(s['safety-warning-1'] || '—')}</div>
        </div>
        <div class="detail-field">
          <div class="df-label">Smartraveller Safety Warning 2</div>
          <div class="df-value">${escHtml(s['safety-warning-2'] || '—')}</div>
        </div>
        <div class="detail-field span-all">
          <div class="df-label">Visa Requirements Details</div>
          <div class="df-value">${escHtml(s['visa-requirement'] || '—')}</div>
        </div>

        <div class="detail-field">
          <div class="df-label">Local Custom 1</div>
          <div class="df-value">${escHtml(s['cultural-custom-1'] || '—')}</div>
        </div>
        <div class="detail-field">
          <div class="df-label">Local Custom 2</div>
          <div class="df-value">${escHtml(s['cultural-custom-2'] || '—')}</div>
        </div>
        <div class="detail-field">
          <div class="df-label">Local Law 1 (Different from Australia)</div>
          <div class="df-value">${escHtml(s['local-law-1'] || '—')}</div>
        </div>
        <div class="detail-field">
          <div class="df-label">Local Law 2 (Different from Australia)</div>
          <div class="df-value">${escHtml(s['local-law-2'] || '—')}</div>
        </div>

        <div class="detail-field">
          <div class="df-label">Insurance Option 1 (Cover-More)</div>
          <div class="df-value">
            Medical: ${escHtml(s['ins1-medical'] || '—')}<br/>
            Excess: $${escHtml(s['ins1-excess'] || '—')} AUD<br/>
            Premium: $${escHtml(s['ins1-premium'] || '—')} AUD<br/>
            Ref: <a href="${escHtml(s['ins1-link'] || '#')}" target="_blank" style="color:var(--teal); font-size:0.75rem;">Link / Screenshot</a>
          </div>
        </div>
        <div class="detail-field">
          <div class="df-label">Insurance Option 2 (Fast Cover)</div>
          <div class="df-value">
            Medical: ${escHtml(s['ins2-medical'] || '—')}<br/>
            Excess: $${escHtml(s['ins2-excess'] || '—')} AUD<br/>
            Premium: $${escHtml(s['ins2-premium'] || '—')} AUD<br/>
            Ref: <a href="${escHtml(s['ins2-link'] || '#')}" target="_blank" style="color:var(--teal); font-size:0.75rem;">Link / Screenshot</a>
          </div>
        </div>
        <div class="detail-field span-all">
          <div class="df-label">Chosen Policy and Reason Justification</div>
          <div class="df-value"><strong>Selected: ${escHtml(s['ins-selected'] || '—')}</strong><br/>${escHtml(s['ins-justification'] || 'No justification entered')}</div>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">🚨 Part D: Emergency Crisis Management Plan</div>
      <div class="detail-grid">
        <div class="detail-field span-all">
          <div class="df-label">Selected Scenario</div>
          <div class="df-value" style="font-weight:bold; color:var(--gold); text-transform:uppercase;">Choice: ${escHtml(s['emergency-scenario'] || 'None')}</div>
        </div>
        <div class="detail-field span-all">
          <div class="df-label">Step 1: First 24 Hours (Immediate Response Plan)</div>
          <div class="df-value">${escHtml(s['em-step1'] || 'No response entered')}</div>
        </div>
        <div class="detail-field span-all">
          <div class="df-label">Step 2: Embassy Consular Assistance (What they Can vs Cannot do)</div>
          <div class="df-value">${escHtml(s['em-step2'] || 'No response entered')}</div>
        </div>
        <div class="detail-field span-all">
          <div class="df-label">Step 3: Accessing Emergency Funds &amp; Claims</div>
          <div class="df-value">${escHtml(s['em-step3'] || 'No response entered')}</div>
        </div>
      </div>
    </div>
  `;
}

// ===== MOCK OFFLINE DATA FOR DEMONSTRATION / TEACHER TESTING =====
function showMockData() {
  allSubmissions = [
    {
      studentName: "Emily Watson",
      classCode: "COMM10_2026",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      'dest-country': "Tokyo, Japan",
      'tourism-type': "Cultural",
      'dest-reason': "Tokyo is an ideal destination for an 18-25 year old client because it blends ultra-modern technology and pop culture with ancient temples and history. It is extremely safe and has an incredibly efficient public transport system, making it easy for young first-time travelers to navigate. Additionally, it offers a wide variety of affordable dining options, from sushi conveyors to ramen booths, fitting the budget perfectly.",
      'trip-duration': "8",
      'flight1-airline': "Qantas Airways",
      'flight1-number': "QF25 / QF26",
      'flight1-baggage': "30kg checked baggage",
      'flight1-price': "1350",
      'flight1-link': "https://qantas.com",
      'flight2-airline': "Jetstar",
      'flight2-number': "JQ15",
      'flight2-baggage': "Carry-on only",
      'flight2-price': "890",
      'flight2-link': "https://jetstar.com",
      'flight-selection-reason': "Selected Qantas for flight options because it includes checked baggage, meals, and in-flight entertainment which is critical for a long-haul international flight, whereas Jetstar was cheaper but added high extra costs for basic baggage limits.",
      'acc1-name': "Oak Hostel Zen Tokyo",
      'acc1-location': "Ueno, Tokyo",
      'acc1-rate': "55",
      'acc1-link': "https://booking.com",
      'acc2-name': "Shinjuku Granbell Hotel",
      'acc2-location': "Kabukicho, Tokyo",
      'acc2-rate': "175",
      'acc2-link': "https://booking.com",
      'acc-selection-reason': "Selected Option 1 (Hostel Ueno) because Ueno is a very safe cultural hub, and paying $55 a night significantly saves budget room compared to the $175 hotel in Shinjuku, leaving more money for sightseeing and tours.",
      'external-spreadsheet-url': "https://docs.google.com/spreadsheets/d/1GFrJ-YZMz5oqxNj56ueMQJcNSq02CNoUflgwVI9NjE4/edit",
      'smartraveller-level': "Level 1: Exercise normal safety precautions",
      'passport-validity': "Must have at least 6 months validity from date of entry",
      'safety-warning-1': "Be aware of bar card scams and drink spiking in popular entertainment districts like Roppongi and Kabukicho.",
      'safety-warning-2': "Japan has frequent typhoons and minor seismic activity. Familiarize yourself with emergency escape routes.",
      'visa-requirement': "Australian citizens carrying standard tourist passports do not need a pre-arranged visa for stays up to 90 days. Visa on arrival is granted at customs.",
      'local-law-1': "It is illegal to carry certain over-the-counter cold and flu medications containing codeine or pseudoephedrine into Japan.",
      'local-law-2': "You must carry your passport with you at all times. Police have the legal right to stop and check your ID at any point.",
      'cultural-custom-1': "Bowing slightly when greeting others or thanking servers, and avoiding tipping which can be considered offensive.",
      'cultural-custom-2': "Do not eat or drink while walking on streets. Instead, stand near the vending machine or convenience store where you purchased it.",
      'ins1-provider': "Cover-More",
      'ins1-medical': "Unlimited Medical Cover",
      'ins1-excess': "250",
      'ins1-premium': "92",
      'ins1-link': "https://covermore.com",
      'ins2-provider': "Fast Cover",
      'ins2-medical': "$10,000,000 Medical Cover",
      'ins2-excess': "100",
      'ins2-premium': "115",
      'ins2-link': "https://fastcover.com.au",
      'ins-selected': "Option 1",
      'ins-justification': "Chose Option 1 (Cover-More) because it provides unlimited medical coverage. Even though the excess is slightly higher ($250 vs $100), the premium is cheaper and unlimited coverage is much safer in case of major accidents requiring surgery.",
      'emergency-scenario': "theft",
      'em-step1': "I would immediately log into iCloud/Google account on a computer to activate 'Find My' and lock my phone. I would call my Australian bank via Skype/web call to block all debit/credit cards. Next, I will go to the nearest local KOBAN (police box) to file a official police theft report and get a copy/receipt number.",
      'em-step2': "I will visit the Australian Embassy in Tokyo. Staff there can issue an Emergency Passport to allow me to travel home and can assist in contacting family. However, embassy staff CANNOT pay my hotel bills, give me cash directly, or purchase plane tickets for me.",
      'em-step3': "I will contact Cover-More emergency helpline online to log the claim, providing the police report number. I will ask family to wire emergency funds via Western Union which can be collected with my emergency passport at a local agent."
    }
  ];

  // Set mock serialized data
  allSubmissions[0]['itinerary-serialized'] = JSON.stringify({
    'itinerary-day1-morning': 'Arrive Narita Airport, check-in to Oak Hostel Zen Ueno.',
    'itinerary-day1-afternoon': 'Unpack and explore Ueno Park gardens.',
    'itinerary-day1-evening': 'Dinner at local ramen street stalls in Ameyoko Market.',
    'itinerary-day1-overnight': 'Oak Hostel Zen Ueno',
    'itinerary-day1-cultural': 'false',
    'itinerary-day2-morning': 'Guided cultural tour of Senso-ji Temple in Asakusa.',
    'itinerary-day2-afternoon': 'Tokyo Skytree observatory deck view.',
    'itinerary-day2-evening': 'Yakitori dinner under Ueno train tracks.',
    'itinerary-day2-overnight': 'Oak Hostel Zen Ueno',
    'itinerary-day2-cultural': 'true',
    'itinerary-day3-morning': 'Explore Akihabara Electric Town.',
    'itinerary-day3-afternoon': 'Visit Meiji Shrine in Harajuku.',
    'itinerary-day3-evening': 'Shibuya Crossing Walk and conveyor belt sushi.',
    'itinerary-day3-overnight': 'Oak Hostel Zen Ueno',
    'itinerary-day3-cultural': 'true',
    'itinerary-day4-morning': 'Sushi breakfast at Tsukiji Outer Market.',
    'itinerary-day4-afternoon': 'TeamLab Planets digital museum.',
    'itinerary-day4-evening': 'Dinner cruise in Odaiba bay.',
    'itinerary-day4-overnight': 'Oak Hostel Zen Ueno',
    'itinerary-day4-cultural': 'false',
    'itinerary-day5-morning': 'Bullet train day excursion to Hakone/Mount Fuji.',
    'itinerary-day5-afternoon': 'Pirate ship cruise on Lake Ashi.',
    'itinerary-day5-evening': 'Hot spring onsen relaxation in Hakone.',
    'itinerary-day5-overnight': 'Oak Hostel Zen Ueno',
    'itinerary-day5-cultural': 'false',
    'itinerary-day6-morning': 'Explore Harajuku shopping districts.',
    'itinerary-day6-afternoon': 'Shinjuku Gyoen National Garden.',
    'itinerary-day6-evening': 'Dinner at Omoide Yokocho.',
    'itinerary-day6-overnight': 'Oak Hostel Zen Ueno',
    'itinerary-day6-cultural': 'false',
    'itinerary-day7-morning': 'Imperial Palace outer gardens tour.',
    'itinerary-day7-afternoon': 'Souvenir shopping in Ginza.',
    'itinerary-day7-evening': 'Tokyo Tower observatory deck at night.',
    'itinerary-day7-overnight': 'Oak Hostel Zen Ueno',
    'itinerary-day7-cultural': 'true',
    'itinerary-day8-morning': 'Check-out hostel, buy bento box.',
    'itinerary-day8-afternoon': 'Express train back to Narita Airport.',
    'itinerary-day8-evening': 'Qantas flight QF26 departing to Sydney.',
    'itinerary-day8-overnight': 'Flight home',
    'itinerary-day8-cultural': 'false'
  });

  allSubmissions[0]['budget-serialized'] = JSON.stringify({
    exchangeRate: 92.5,
    currencyCode: 'JPY',
    contingencyOverride: 650.00,
    items: [
      { id: 'item-flights', category: 'Transport', description: 'International Flights (Selected Return Option)', foreignCost: 0, isAUDDirect: true, audCost: 1350 },
      { id: 'item-accommodation', category: 'Accommodation', description: 'Selected Accommodation (7 Nights)', foreignCost: 385, isAUDDirect: true, audCost: 385 },
      { id: 'item-transfers', category: 'Transport', description: 'Return Airport Transfers Skyliner', foreignCost: 4400, isAUDDirect: false, audCost: 47.57 },
      { id: 'item-insurance', category: 'Before-You-Go', description: 'Selected Travel Insurance Policy (Covermore)', foreignCost: 0, isAUDDirect: true, audCost: 92 },
      { id: 'item-passport', category: 'Before-You-Go', description: 'Australian Passport Application Fee', foreignCost: 0, isAUDDirect: true, audCost: 325 },
      { id: 'item-meals', category: 'Daily Spending', description: 'Meals and Personal Incidentals (8 days)', foreignCost: 59200, isAUDDirect: false, audCost: 640.00 },
      { id: 'item-custom-1', category: 'Daily Spending', description: 'Mount Fuji Day Tour Ticket', foreignCost: 12000, isAUDDirect: false, audCost: 129.73 },
      { id: 'item-custom-2', category: 'Daily Spending', description: 'TeamLab Planets Ticket', foreignCost: 3800, isAUDDirect: false, audCost: 41.08 }
    ]
  });

  renderDashboard();
}

// ===== CSV EXPORT =====
function exportCSV() {
  if (!allSubmissions.length) { alert('No submissions to export.'); return; }

  const headers = [
    'Timestamp', 'Student Name', 'Class Code', 'Destination', 'Tourism Type',
    'Justification Reason', 'Trip Duration', 'Flight Option 1', 'Flight Option 2',
    'Flight Chosen Reason', 'Accommodation Option 1', 'Accommodation Option 2',
    'Accommodation Chosen Reason', 'Budget Grand Total', 'Spreadsheet Link',
    'Smartraveller Level', 'Passport Validity', 'Visa Rules',
    'Customs and Laws', 'Insurance Option 1', 'Insurance Option 2',
    'Insurance Chosen Reason', 'Emergency Scenario', 'Crisis Response Step 1',
    'Crisis Response Step 2', 'Crisis Response Step 3'
  ];

  const csvRows = [headers.join(',')];

  allSubmissions.forEach(s => {
    let grandTotalAUD = 0;
    try {
      if (s['budget-serialized']) {
        const budget = JSON.parse(s['budget-serialized']);
        const base = budget.items.reduce((sum, item) => sum + (item.audCost || 0), 0);
        const contingency = budget.contingencyOverride !== undefined ? budget.contingencyOverride : (base * 0.08);
        grandTotalAUD = base + contingency;
      }
    } catch(e) {}

    const row = [
      s.timestamp || '',
      s.studentName || '',
      s.classCode || '',
      s['dest-country'] || '',
      s['tourism-type'] || '',
      s['dest-reason'] || '',
      s['trip-duration'] || '',
      `${s['flight1-airline'] || ''} ($${s['flight1-price'] || ''})`,
      `${s['flight2-airline'] || ''} ($${s['flight2-price'] || ''})`,
      s['flight-selection-reason'] || '',
      `${s['acc1-name'] || ''} ($${s['acc1-rate'] || ''}/night)`,
      `${s['acc2-name'] || ''} ($${s['acc2-rate'] || ''}/night)`,
      s['acc-selection-reason'] || '',
      grandTotalAUD > 0 ? `$${grandTotalAUD.toFixed(2)} AUD` : '',
      s['external-spreadsheet-url'] || '',
      s['smartraveller-level'] || '',
      s['passport-validity'] || '',
      s['visa-requirement'] || '',
      `Law1: ${s['local-law-1'] || ''}; Law2: ${s['local-law-2'] || ''}; Custom1: ${s['cultural-custom-1'] || ''}; Custom2: ${s['cultural-custom-2'] || ''}`,
      `${s['ins1-provider'] || ''} (Premium: $${s['ins1-premium'] || ''})`,
      `${s['ins2-provider'] || ''} (Premium: $${s['ins2-premium'] || ''})`,
      s['ins-justification'] || '',
      s['emergency-scenario'] || '',
      s['em-step1'] || '',
      s['em-step2'] || '',
      s['em-step3'] || ''
    ];

    const escapedRow = row.map(v => {
      let str = String(v).replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        str = `"${str}"`;
      }
      return str;
    });

    csvRows.push(escapedRow.join(','));
  });

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Year_10_Commerce_Travel_Submissions_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ===== UTILS =====
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
