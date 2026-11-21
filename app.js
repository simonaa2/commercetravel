// ===================================================
// YEAR 10 COMMERCE TRAVEL SCAFFOLD — app.js
// ===================================================

// ===== 1. AUTHENTICATION GUARD =====
const studentName = sessionStorage.getItem('studentName');
const classCode   = sessionStorage.getItem('classCode');

if (!studentName || classCode !== CONFIG.CLASS_CODE) {
  window.location.href = 'index.html';
}

// Display student name and avatar initial
document.getElementById('student-name-display').textContent = studentName;
document.getElementById('student-avatar').textContent = studentName.charAt(0).toUpperCase();

// ===== THEME TOGGLE (DARK / LIGHT MODE) =====
function initTheme() {
  const savedTheme = localStorage.getItem('app_theme') || 'dark';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  try {
    localStorage.setItem('app_theme', newTheme);
  } catch(e) {}
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  const text = document.getElementById('theme-text');
  if (theme === 'light') {
    if (icon) icon.textContent = '🌙';
    if (text) text.textContent = 'Dark Mode';
  } else {
    if (icon) icon.textContent = '☀️';
    if (text) text.textContent = 'Light Mode';
  }
  document.querySelectorAll('.theme-icon').forEach(el => { el.textContent = theme === 'light' ? '🌙' : '☀️'; });
  document.querySelectorAll('.theme-text').forEach(el => { el.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode'; });
}
initTheme();

// ===== 2. COUNTDOWN TIMER =====
function updateCountdown() {
  const due  = new Date(CONFIG.DUE_DATE);
  const diff = due - new Date();
  const el   = document.getElementById('countdown');
  if (!el) return;
  
  if (diff <= 0) {
    el.textContent = '⏰ Submission Past Due!';
    el.style.color = 'var(--red)';
    return;
  }
  
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  el.textContent = `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ===== 3. TABS NAVIGATION =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    const content = document.getElementById(`tab-content-${target}`);
    if (content) {
      content.classList.add('active');
    }
  });
});

// ===== 4. DYNAMIC ITINERARY BUILDER =====
// Store itinerary descriptions in memory to avoid wiping them out when toggling days
let itineraryData = {};

function initItineraryTable() {
  const durationSelect = document.getElementById('trip-duration');
  const tbody = document.getElementById('itinerary-tbody');
  
  const currentDuration = parseInt(durationSelect.value) || 7;
  tbody.innerHTML = '';
  
  for (let i = 1; i <= currentDuration; i++) {
    const mKey = `itinerary-day${i}-morning`;
    const aKey = `itinerary-day${i}-afternoon`;
    const eKey = `itinerary-day${i}-evening`;
    const sKey = `itinerary-day${i}-overnight`;
    const cKey = `itinerary-day${i}-cultural`;
    
    const morningVal = itineraryData[mKey] || '';
    const afternoonVal = itineraryData[aKey] || '';
    const eveningVal = itineraryData[eKey] || '';
    const overnightVal = itineraryData[sKey] || '';
    const culturalChecked = itineraryData[cKey] === 'true' ? 'checked' : '';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span class="day-badge">Day ${i}</span></td>
      <td><textarea id="${mKey}" class="field-textarea itinerary-textarea" rows="2" placeholder="Morning plans...">${morningVal}</textarea></td>
      <td><textarea id="${aKey}" class="field-textarea itinerary-textarea" rows="2" placeholder="Afternoon activities...">${afternoonVal}</textarea></td>
      <td><textarea id="${eKey}" class="field-textarea itinerary-textarea" rows="2" placeholder="Evening plans...">${eveningVal}</textarea></td>
      <td><input type="text" id="${sKey}" class="field-input itinerary-input" placeholder="Accommodation name" value="${overnightVal}"/></td>
      <td class="cultural-check-td">
        <label>
          <input type="checkbox" id="${cKey}" class="itinerary-check" ${culturalChecked}/>
          Cultural
        </label>
      </td>
    `;
    tbody.appendChild(row);
  }
  
  // Wire up change listeners on the newly created elements
  tbody.querySelectorAll('textarea, input').forEach(el => {
    el.addEventListener('input', () => {
      const isCheck = el.type === 'checkbox';
      itineraryData[el.id] = isCheck ? String(el.checked) : el.value;
      if (isCheck) checkCulturalLandmark();
      triggerSave();
    });
  });
  
  checkCulturalLandmark();
}

function checkCulturalLandmark() {
  const checkboxes = document.querySelectorAll('.itinerary-check');
  let hasCultural = false;
  checkboxes.forEach(cb => {
    if (cb.checked) hasCultural = true;
  });
  
  const indicator = document.getElementById('cultural-check-indicator');
  if (hasCultural) {
    indicator.textContent = '✅ Cultural landmark/site included!';
    indicator.style.color = 'var(--green)';
  } else {
    indicator.textContent = '⚠️ Please mark at least one cultural landmark/site in the itinerary.';
    indicator.style.color = 'var(--gold)';
  }
}

document.getElementById('trip-duration').addEventListener('change', () => {
  initItineraryTable();
  updateBudgetAccommodationNights();
  triggerSave();
});

// Helper to update budget accommodation nights when trip duration changes
function updateBudgetAccommodationNights() {
  const duration = parseInt(document.getElementById('trip-duration').value) || 7;
  const nights = duration - 1; // 7 days = 6 nights, etc.
  
  // Find accommodation row and update its foreign cost description / base calculations
  const accRow = budgetItems.find(item => item.isDefaultAccommodation);
  if (accRow) {
    accRow.quantity = nights;
    accRow.description = `Selected Accommodation (${nights} Nights)`;
    // Update foreign cost: nights * selected rate
    const selectedRate = parseFloat(getAccommodationSelectedRate()) || 0;
    accRow.foreignCost = selectedRate * nights;
    renderBudgetTable();
    recalculateBudget();
  }
}

// ===== 5. BUDGET BUILDER LOGIC =====
let budgetItems = [];

// Get selected flight price
function getFlightSelectedPrice() {
  // Option 1 is selected by default unless option 2 is entered and they write something,
  // but to keep it simple, we check if they filled option 1, use that, or check if option 2 is filled.
  const f1 = parseFloat(document.getElementById('flight1-price').value) || 0;
  return f1;
}

// Get accommodation nightly rate
function getAccommodationSelectedRate() {
  const r1 = parseFloat(document.getElementById('acc1-rate').value) || 0;
  return r1;
}

// Get selected travel insurance premium
function getInsurancePremium() {
  const selected = document.getElementById('ins-selected').value;
  const p1 = parseFloat(document.getElementById('ins1-premium').value) || 0;
  const p2 = parseFloat(document.getElementById('ins2-premium').value) || 0;
  
  if (selected === 'Option 2') return p2;
  return p1 || p2; // Default to Option 1 premium
}

function initDefaultBudgetItems() {
  const duration = parseInt(document.getElementById('trip-duration').value) || 7;
  const nights = duration - 1;
  const flightPrice = getFlightSelectedPrice();
  const accRate = getAccommodationSelectedRate();
  const insPremium = getInsurancePremium();

  budgetItems = [
    {
      id: 'item-flights',
      category: 'Transport',
      description: 'International Flights (Selected Return Option)',
      foreignCost: 0, // Flights are in AUD directly
      isAUDDirect: true,
      audCost: flightPrice,
      isDefaultFlight: true
    },
    {
      id: 'item-accommodation',
      category: 'Accommodation',
      description: `Selected Accommodation (${nights} Nights)`,
      foreignCost: accRate * nights,
      isAUDDirect: true, // Accommodation in our form is in AUD directly
      audCost: accRate * nights,
      quantity: nights,
      isDefaultAccommodation: true
    },
    {
      id: 'item-transfers',
      category: 'Transport',
      description: 'Return Airport Transfers',
      foreignCost: 50,
      isAUDDirect: false,
      audCost: 0
    },
    {
      id: 'item-insurance',
      category: 'Before-You-Go',
      description: 'Selected Travel Insurance Policy',
      foreignCost: 0,
      isAUDDirect: true,
      audCost: insPremium,
      isDefaultInsurance: true
    },
    {
      id: 'item-passport',
      category: 'Before-You-Go',
      description: 'Australian Passport Application Fee',
      foreignCost: 0,
      isAUDDirect: true,
      audCost: 325 // Default standard passport fee
    },
    {
      id: 'item-meals',
      category: 'Daily Spending',
      description: `Meals and Personal Incidentals ($80/day equivalent)`,
      foreignCost: 80 * duration,
      isAUDDirect: false,
      audCost: 0
    }
  ];
}

function addBudgetRow() {
  const currencyCode = document.getElementById('budget-currency-code').value || 'USD';
  const id = 'item-' + Date.now();
  
  budgetItems.push({
    id: id,
    category: 'Daily Spending',
    description: 'Custom Sightseeing / Guided Tour Fee',
    foreignCost: 50,
    isAUDDirect: false,
    audCost: 0
  });
  
  renderBudgetTable();
  recalculateBudget();
  triggerSave();
}

function removeBudgetRow(id) {
  budgetItems = budgetItems.filter(item => item.id !== id);
  renderBudgetTable();
  recalculateBudget();
  triggerSave();
}

// Conversion calculation helper
function convertForeignToAUD(foreignAmount, rate, direction) {
  const amt = parseFloat(foreignAmount) || 0;
  const r = parseFloat(rate) || 1;
  if (amt <= 0) return 0;
  if (r <= 0) return amt;

  if (direction === 'foreign_to_aud') {
    // 1 Foreign = X AUD (e.g. 1 USD = 1.54 AUD, 1 EUR = 1.65 AUD)
    return amt * r;
  } else {
    // 1 AUD = X Foreign (e.g. 1 AUD = 0.65 USD, 1 AUD = 98 JPY)
    return amt / r;
  }
}

function updateCurrencyHelperBox(currencyCode, rate, direction) {
  const formulaEl = document.getElementById('currency-formula-text');
  const previewEl = document.getElementById('currency-preview-text');
  const rateLabel = document.getElementById('budget-rate-label');
  
  if (!formulaEl || !previewEl) return;

  const cur = (currencyCode || 'USD').trim().toUpperCase();
  const r = parseFloat(rate) || 1;
  const isHighDenom = ['JPY', 'IDR', 'KRW', 'VND', 'THB', 'CLP'].includes(cur);
  const sampleAmt = isHighDenom ? (cur === 'THB' ? 1000 : 10000) : 100;

  if (direction === 'foreign_to_aud') {
    if (rateLabel) rateLabel.textContent = `Exchange Rate (1 ${cur} = ? AUD)`;
    formulaEl.innerHTML = `📐 Formula: <code style="color:var(--teal); font-family:monospace; background:rgba(0,0,0,0.15); padding:0.15rem 0.3rem; border-radius:4px;">AUD = ${cur} × Rate</code>`;
    const sampleAUD = convertForeignToAUD(sampleAmt, r, 'foreign_to_aud');
    previewEl.innerHTML = `💡 Live Example: ${sampleAmt.toLocaleString()} ${cur} = <strong>$${sampleAUD.toLocaleString('en-AU', {minimumFractionDigits:2, maximumFractionDigits:2})} AUD</strong>`;
  } else {
    if (rateLabel) rateLabel.textContent = `Exchange Rate (1 AUD = ? ${cur})`;
    formulaEl.innerHTML = `📐 Formula: <code style="color:var(--teal); font-family:monospace; background:rgba(0,0,0,0.15); padding:0.15rem 0.3rem; border-radius:4px;">AUD = ${cur} ÷ Rate</code>`;
    const sampleAUD = convertForeignToAUD(sampleAmt, r, 'aud_to_foreign');
    previewEl.innerHTML = `💡 Live Example: ${sampleAmt.toLocaleString()} ${cur} = <strong>$${sampleAUD.toLocaleString('en-AU', {minimumFractionDigits:2, maximumFractionDigits:2})} AUD</strong>`;
  }
}

function renderBudgetTable() {
  const tbody = document.getElementById('budget-tbody');
  if (!tbody) return;

  const currencyCode = (document.getElementById('budget-currency-code')?.value || 'USD').trim().toUpperCase();
  const exchangeRate = parseFloat(document.getElementById('budget-exchange-rate')?.value) || 1;
  const rateDirection = document.getElementById('budget-rate-direction')?.value || 'aud_to_foreign';
  tbody.innerHTML = '';

  budgetItems.forEach((item, index) => {
    const tr = document.createElement('tr');
    
    // Select dropdown for Category
    const categories = ['Transport', 'Accommodation', 'Daily Spending', 'Before-You-Go'];
    let catOptions = categories.map(c => 
      `<option value="${c}" ${item.category === c ? 'selected' : ''}>${c}</option>`
    ).join('');

    const descInput = `<input type="text" class="field-input table-row-input" value="${item.description ? item.description.replace(/"/g, '&quot;') : ''}" oninput="updateBudgetItem(${index}, 'description', this.value)" onchange="updateBudgetItem(${index}, 'description', this.value)"/>`;
    
    // Cost value shown in the input box (preserves 0 cleanly)
    const costVal = item.isAUDDirect ? (item.audCost !== undefined ? item.audCost : 0) : (item.foreignCost !== undefined ? item.foreignCost : 0);
    const costDisplayVal = (costVal !== '' && costVal !== null && !isNaN(costVal)) ? (costVal === 0 ? '0' : Number(costVal.toFixed(2))) : '';
    const costInput = `<input type="number" class="field-input table-row-input" value="${costDisplayVal}" placeholder="0" step="any" min="0" oninput="updateBudgetItem(${index}, 'cost', this.value)" onchange="updateBudgetItem(${index}, 'cost', this.value)"/>`;

    const currencySelect = `
      <select class="field-select table-row-input" style="padding:0.25rem 0.3rem; text-align:center; font-weight:600; color:var(--teal);" onchange="updateBudgetItem(${index}, 'isAUDDirect', this.value)">
        <option value="Foreign" ${!item.isAUDDirect ? 'selected' : ''}>${currencyCode}</option>
        <option value="AUD" ${item.isAUDDirect ? 'selected' : ''}>AUD</option>
      </select>
    `;
    
    let itemAUD = 0;
    if (item.isAUDDirect) {
      itemAUD = parseFloat(item.audCost) || 0;
    } else {
      itemAUD = convertForeignToAUD(item.foreignCost, exchangeRate, rateDirection);
      item.audCost = itemAUD;
    }
    const audDisplay = `<span id="aud-cost-${item.id}" style="font-weight: 600;">$${itemAUD.toLocaleString('en-AU', {minimumFractionDigits: 2, maximumFractionDigits: 2})} AUD</span>`;
    
    const removeBtn = `<button class="btn-remove-row" onclick="removeBudgetRow('${item.id}')" title="Delete row">✕</button>`;

    tr.innerHTML = `
      <td><select class="field-select table-row-input" onchange="updateBudgetItem(${index}, 'category', this.value)">${catOptions}</select></td>
      <td>${descInput}</td>
      <td>${costInput}</td>
      <td style="text-align:center;">${currencySelect}</td>
      <td>${audDisplay}</td>
      <td style="text-align:center;">${removeBtn}</td>
    `;
    tbody.appendChild(tr);
  });
}

function updateBudgetItem(index, field, value) {
  const item = budgetItems[index];
  if (!item) return;

  const exchangeRate = parseFloat(document.getElementById('budget-exchange-rate')?.value) || 1;
  const rateDirection = document.getElementById('budget-rate-direction')?.value || 'aud_to_foreign';

  if (field === 'cost') {
    const num = parseFloat(value);
    const validNum = isNaN(num) ? 0 : num;
    if (item.isAUDDirect) {
      item.audCost = validNum;
    } else {
      item.foreignCost = validNum;
      item.audCost = convertForeignToAUD(validNum, exchangeRate, rateDirection);
    }
    // Update this specific row's AUD display immediately for smooth live typing
    const cell = document.getElementById(`aud-cost-${item.id}`);
    if (cell) {
      cell.textContent = '$' + item.audCost.toLocaleString('en-AU', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' AUD';
    }
  } else if (field === 'isAUDDirect') {
    const toAUD = (value === 'AUD');
    // Keep the student's entered number intact without mutating or multiplying by rates
    const currentVal = item.isAUDDirect ? (item.audCost || 0) : (item.foreignCost || 0);
    if (toAUD) {
      item.isAUDDirect = true;
      item.audCost = currentVal;
    } else {
      item.isAUDDirect = false;
      item.foreignCost = currentVal;
      item.audCost = convertForeignToAUD(currentVal, exchangeRate, rateDirection);
    }
    renderBudgetTable();
  } else {
    item[field] = value;
  }
  recalculateBudget();
  triggerSave();
}

function recalculateBudget() {
  const currencyCode = (document.getElementById('budget-currency-code')?.value || 'USD').trim().toUpperCase();
  const exchangeRate = parseFloat(document.getElementById('budget-exchange-rate')?.value) || 1;
  const rateDirection = document.getElementById('budget-rate-direction')?.value || 'aud_to_foreign';
  let baseTotal = 0;

  budgetItems.forEach(item => {
    let audCost = 0;
    if (item.isAUDDirect) {
      audCost = parseFloat(item.audCost) || 0;
    } else {
      audCost = convertForeignToAUD(item.foreignCost, exchangeRate, rateDirection);
      item.audCost = audCost; // Sync memory
    }
    
    baseTotal += audCost;
    const cell = document.getElementById(`aud-cost-${item.id}`);
    if (cell) {
      cell.textContent = '$' + audCost.toLocaleString('en-AU', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' AUD';
    }
  });

  // Update live helper box
  updateCurrencyHelperBox(currencyCode, exchangeRate, rateDirection);

  // Calculate contingency (default to 8% of base total if no stored contingency, capped between $500 and $1,000)
  let contingency = parseFloat(document.getElementById('budget-contingency-override')?.value);
  if (isNaN(contingency)) {
    contingency = baseTotal * 0.08;
    if (contingency < 500) contingency = 500;
    if (contingency > 1000) contingency = 1000;
  }

  const grandTotal = baseTotal + contingency;

  // Render summaries
  const baseEl = document.getElementById('budget-base-aud');
  if (baseEl) baseEl.textContent = '$' + baseTotal.toLocaleString('en-AU', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' AUD';
  
  // Render contingency selector or display
  const contPercent = baseTotal > 0 ? (contingency / baseTotal * 100) : 0;
  const contAudEl = document.getElementById('budget-contingency-aud');
  if (contAudEl) {
    const activeEl = document.activeElement;
    const overrideInput = document.getElementById('budget-contingency-override');
    if (!overrideInput || activeEl !== overrideInput) {
      contAudEl.innerHTML = `
        <input type="number" id="budget-contingency-override" class="field-input" style="max-width:120px; text-align:right; display:inline-block; padding:0.3rem 0.5rem;" value="${contingency.toFixed(2)}" onchange="handleContingencyOverride(this.value)"/> AUD
      `;
    }
  }
  const contPctEl = document.getElementById('budget-contingency-percent');
  if (contPctEl) contPctEl.textContent = `${contPercent.toFixed(1)}% of base expenses`;

  const grandEl = document.getElementById('budget-grand-total-aud');
  if (grandEl) grandEl.textContent = '$' + grandTotal.toLocaleString('en-AU', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' AUD';

  // Validate Spending Cap ($10,000 AUD)
  const capBadge = document.getElementById('budget-status-cap');
  if (capBadge) {
    if (grandTotal <= 10000) {
      capBadge.className = 'budget-badge success';
      capBadge.innerHTML = `✅ Total Budget Approved: $${grandTotal.toLocaleString('en-AU', {maximumFractionDigits:2})} AUD is under the $10,000 limit.`;
    } else {
      capBadge.className = 'budget-badge error';
      capBadge.innerHTML = `❌ BUDGET EXCEEDED: $${grandTotal.toLocaleString('en-AU', {maximumFractionDigits:2})} AUD exceeds the $10,000 limit by $${(grandTotal - 10000).toLocaleString('en-AU', {maximumFractionDigits:2})}! Please reduce your costs.`;
    }
  }

  // Validate Contingency Rules ($500 - $1,000 AUD and 5% - 10% of base)
  const contBadge = document.getElementById('budget-status-contingency');
  if (contBadge) {
    const isAmtValid = contingency >= 500 && contingency <= 1000;
    const isPctValid = contPercent >= 5 && contPercent <= 10;

    if (isAmtValid && isPctValid) {
      contBadge.className = 'budget-badge success';
      contBadge.innerHTML = `✅ Contingency Valid: $${contingency.toFixed(2)} AUD is within the $500 - $1,000 range (${contPercent.toFixed(1)}%).`;
    } else {
      contBadge.className = 'budget-badge error';
      let errors = [];
      if (!isAmtValid) errors.push(`must be between $500 and $1,000 AUD (currently $${contingency.toFixed(2)})`);
      if (!isPctValid) errors.push(`must be 5% to 10% of base expenses (currently ${contPercent.toFixed(1)}%)`);
      contBadge.innerHTML = `⚠️ Contingency Warning: Buffer ${errors.join(' and ')}.`;
    }
  }

  // Save budget item state to a hidden serialization input for auto-save harvesting
  let budgetSerializedInput = document.getElementById('budget-serialized-data');
  if (!budgetSerializedInput) {
    budgetSerializedInput = document.createElement('input');
    budgetSerializedInput.type = 'hidden';
    budgetSerializedInput.id = 'budget-serialized-data';
    document.body.appendChild(budgetSerializedInput);
  }
  budgetSerializedInput.value = JSON.stringify({
    items: budgetItems,
    exchangeRate: exchangeRate,
    currencyCode: currencyCode,
    rateDirection: rateDirection,
    contingencyOverride: contingency
  });
}

function handleContingencyOverride(val) {
  const amt = parseFloat(val) || 0;
  // Store it, recalculate
  recalculateBudget();
  triggerSave();
}

// Sync Quote inputs to their budget counterpart rows
function syncQuotesToBudget() {
  const flightPrice = getFlightSelectedPrice();
  const accRate = getAccommodationSelectedRate();
  const duration = parseInt(document.getElementById('trip-duration').value) || 7;
  const nights = duration - 1;
  const insPremium = getInsurancePremium();

  const flightRow = budgetItems.find(x => x.isDefaultFlight);
  if (flightRow) {
    flightRow.audCost = flightPrice;
  }

  const accRow = budgetItems.find(x => x.isDefaultAccommodation);
  if (accRow) {
    accRow.quantity = nights;
    accRow.foreignCost = accRate * nights;
    accRow.audCost = accRate * nights;
  }

  const insRow = budgetItems.find(x => x.isDefaultInsurance);
  if (insRow) {
    insRow.audCost = insPremium;
  }

  renderBudgetTable();
  recalculateBudget();
}

// Attach event listeners to quotes to trigger synchronization
['flight1-price', 'flight2-price', 'acc1-rate', 'acc2-rate', 'ins-selected', 'ins1-premium', 'ins2-premium'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => {
      syncQuotesToBudget();
    });
    el.addEventListener('change', () => {
      syncQuotesToBudget();
    });
  }
});

['budget-currency-code', 'budget-exchange-rate', 'budget-rate-direction'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => {
      recalculateBudget();
      renderBudgetTable();
      triggerSave();
    });
    el.addEventListener('change', () => {
      recalculateBudget();
      renderBudgetTable();
      triggerSave();
    });
  }
});

// ===== 6. EMERGENCY SCENARIO CHOICE SELECTION =====
function selectScenario(val) {
  document.getElementById('emergency-scenario').value = val;
  
  // Highlight card
  ['theft', 'medical', 'grounding'].forEach(s => {
    document.getElementById(`sc-card-${s}`).classList.remove('selected');
  });
  document.getElementById(`sc-card-${val}`).classList.add('selected');
  
  // Show inputs
  document.getElementById('emergency-form-fields').style.display = 'block';
  document.getElementById('emergency-placeholder-alert').style.display = 'none';
  
  triggerSave();
}

// ===== 7. WORD COUNTER SYSTEM =====
function setupWordCounters() {
  const inputs = [
    { id: 'dest-reason', counterId: 'dest-reason-words', min: 60 },
    { id: 'ins-justification', counterId: 'ins-justification-words', min: 40 },
    { id: 'em-step1', counterId: 'em-step1-words', min: 40 },
    { id: 'em-step2', counterId: 'em-step2-words', min: 40 },
    { id: 'em-step3', counterId: 'em-step3-words', min: 40 }
  ];

  inputs.forEach(cfg => {
    const el = document.getElementById(cfg.id);
    const counterEl = document.getElementById(cfg.counterId);
    if (!el || !counterEl) return;

    function countWords() {
      const text = el.value.trim();
      const words = text === '' ? 0 : text.split(/\s+/).filter(w => w.length > 0).length;
      counterEl.textContent = words;
      
      if (words >= cfg.min) {
        counterEl.style.color = 'var(--green)';
      } else {
        counterEl.style.color = 'var(--text-dim)';
      }
    }
    
    el.addEventListener('input', countWords);
    // Initial run
    setTimeout(countWords, 150);
  });
}

// ===== 8. LOCAL AUTO-SAVE HOOKS =====
const SAVE_KEY = `commerce_travel_scaffold_${studentName.replace(/\s+/g,'_').toLowerCase()}`;

function collectAllData() {
  recalculateBudget();
  const data = {
    studentName: studentName,
    classCode: classCode,
    timestamp: new Date().toISOString(),
    // Standard inputs
    'dest-country': document.getElementById('dest-country').value,
    'tourism-type': document.getElementById('tourism-type').value,
    'dest-reason': document.getElementById('dest-reason').value,
    'trip-duration': document.getElementById('trip-duration').value,
    
    'flight1-airline': document.getElementById('flight1-airline').value,
    'flight1-number': document.getElementById('flight1-number').value,
    'flight1-baggage': document.getElementById('flight1-baggage').value,
    'flight1-price': document.getElementById('flight1-price').value,
    'flight1-link': document.getElementById('flight1-link').value,
    
    'flight2-airline': document.getElementById('flight2-airline').value,
    'flight2-number': document.getElementById('flight2-number').value,
    'flight2-baggage': document.getElementById('flight2-baggage').value,
    'flight2-price': document.getElementById('flight2-price').value,
    'flight2-link': document.getElementById('flight2-link').value,
    'flight-selection-reason': document.getElementById('flight-selection-reason').value,
    
    'acc1-name': document.getElementById('acc1-name').value,
    'acc1-location': document.getElementById('acc1-location').value,
    'acc1-rate': document.getElementById('acc1-rate').value,
    'acc1-link': document.getElementById('acc1-link').value,
    
    'acc2-name': document.getElementById('acc2-name').value,
    'acc2-location': document.getElementById('acc2-location').value,
    'acc2-rate': document.getElementById('acc2-rate').value,
    'acc2-link': document.getElementById('acc2-link').value,
    'acc-selection-reason': document.getElementById('acc-selection-reason').value,
    
    'external-spreadsheet-url': document.getElementById('external-spreadsheet-url').value,
    
    'smartraveller-level': document.getElementById('smartraveller-level').value,
    'passport-validity': document.getElementById('passport-validity').value,
    'safety-warning-1': document.getElementById('safety-warning-1').value,
    'safety-warning-2': document.getElementById('safety-warning-2').value,
    'visa-requirement': document.getElementById('visa-requirement').value,
    
    'local-law-1': document.getElementById('local-law-1').value,
    'local-law-2': document.getElementById('local-law-2').value,
    'cultural-custom-1': document.getElementById('cultural-custom-1').value,
    'cultural-custom-2': document.getElementById('cultural-custom-2').value,
    
    'ins1-provider': document.getElementById('ins1-provider').value,
    'ins1-medical': document.getElementById('ins1-medical').value,
    'ins1-excess': document.getElementById('ins1-excess').value,
    'ins1-premium': document.getElementById('ins1-premium').value,
    'ins1-link': document.getElementById('ins1-link').value,
    
    'ins2-provider': document.getElementById('ins2-provider').value,
    'ins2-medical': document.getElementById('ins2-medical').value,
    'ins2-excess': document.getElementById('ins2-excess').value,
    'ins2-premium': document.getElementById('ins2-premium').value,
    'ins2-link': document.getElementById('ins2-link').value,
    
    'ins-selected': document.getElementById('ins-selected').value,
    'ins-justification': document.getElementById('ins-justification').value,
    
    'emergency-scenario': document.getElementById('emergency-scenario').value,
    'em-step1': document.getElementById('em-step1').value,
    'em-step2': document.getElementById('em-step2').value,
    'em-step3': document.getElementById('em-step3').value,
    
    // Milestones Checkboxes
    'milestone-w7': document.getElementById('milestone-w7').checked ? 'true' : 'false',
    'milestone-w8': document.getElementById('milestone-w8').checked ? 'true' : 'false',
    'milestone-w9': document.getElementById('milestone-w9').checked ? 'true' : 'false',
    
    // Serialized Sub-Structures
    'itinerary-serialized': JSON.stringify(itineraryData),
    'budget-serialized': document.getElementById('budget-serialized-data')?.value || ''
  };
  
  return data;
}

function restoreData(data) {
  // Restore basic inputs
  Object.keys(data).forEach(key => {
    const el = document.getElementById(key);
    if (el && key !== 'itinerary-serialized' && key !== 'budget-serialized') {
      if (el.type === 'checkbox') {
        el.checked = data[key] === 'true';
      } else {
        el.value = data[key];
      }
    }
  });

  // Restore emergency scenario card highlight
  if (data['emergency-scenario']) {
    selectScenario(data['emergency-scenario']);
  }

  // Restore itinerary sub-structure
  if (data['itinerary-serialized']) {
    try {
      itineraryData = JSON.parse(data['itinerary-serialized']);
    } catch (e) {
      itineraryData = {};
    }
  }
  
  // Re-generate itinerary tables
  initItineraryTable();

  // Restore budget sub-structure
  if (data['budget-serialized']) {
    try {
      const parsedBudget = JSON.parse(data['budget-serialized']);
      budgetItems = parsedBudget.items || [];
      const curEl = document.getElementById('budget-currency-code');
      if (curEl && parsedBudget.currencyCode) curEl.value = parsedBudget.currencyCode;

      const rateDirEl = document.getElementById('budget-rate-direction');
      if (rateDirEl && parsedBudget.rateDirection) rateDirEl.value = parsedBudget.rateDirection;

      const rateEl = document.getElementById('budget-exchange-rate');
      if (rateEl && parsedBudget.exchangeRate !== undefined) rateEl.value = parsedBudget.exchangeRate;
      
      // We render an override element so recalculateBudget can harvest it
      let overrideInput = document.getElementById('budget-contingency-override');
      if (overrideInput && parsedBudget.contingencyOverride !== undefined) {
        overrideInput.value = parsedBudget.contingencyOverride;
      }
    } catch (e) {
      initDefaultBudgetItems();
    }
  } else {
    initDefaultBudgetItems();
  }

  renderBudgetTable();
  recalculateBudget();
}

// Auto-save logic
let saveTimer;
function triggerSave() {
  const spinner = document.getElementById('save-spinner');
  const indicator = document.getElementById('save-indicator');
  
  if (spinner) spinner.style.display = 'inline-block';
  if (indicator) indicator.textContent = 'Saving...';
  
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(collectAllData()));
      if (spinner) spinner.style.display = 'none';
      if (indicator) {
        const now = new Date();
        indicator.textContent = '💾 Saved ' + now.toLocaleTimeString('en-AU', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
      }
    } catch(e) {
      if (spinner) spinner.style.display = 'none';
      if (indicator) indicator.textContent = '⚠️ Auto-save failed';
    }
  }, 800);
}

// Attach inputs listeners for save
document.addEventListener('input', (e) => {
  if (e.target.closest('#itinerary-tbody') || e.target.closest('#budget-tbody')) {
    // These are handled by their own functions to avoid timing loops
    return;
  }
  triggerSave();
});
document.addEventListener('change', (e) => {
  if (e.target.closest('#itinerary-tbody') || e.target.closest('#budget-tbody')) {
    return;
  }
  triggerSave();
});

// Restore on page load
try {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    restoreData(JSON.parse(saved));
  } else {
    // Initial setups
    initItineraryTable();
    initDefaultBudgetItems();
    renderBudgetTable();
    recalculateBudget();
  }
} catch(e) {
  initItineraryTable();
  initDefaultBudgetItems();
  renderBudgetTable();
  recalculateBudget();
}

// Initialise Counters
setupWordCounters();

// Show previous submission time if exists
const prevSubmit = localStorage.getItem(SAVE_KEY + '_submitted');
if (prevSubmit) {
  const status = document.getElementById('submit-status');
  if (status) {
    const d = new Date(prevSubmit);
    status.textContent = '✅ Dossier submitted: ' + d.toLocaleString('en-AU');
    status.style.color = 'var(--green)';
  }
}

// ===== 9. SUBMISSION SYSTEM =====
function openSubmitModal() {
  document.getElementById('submit-overlay').style.display = 'flex';
  document.getElementById('submit-spinner').style.display = 'flex';
  document.getElementById('submit-success').style.display = 'none';
  document.getElementById('submit-fail').style.display = 'none';
  
  submitDossier();
}

async function submitDossier() {
  const data = collectAllData();
  const spinner = document.getElementById('submit-spinner');
  const successEl = document.getElementById('submit-success');
  const failEl = document.getElementById('submit-fail');
  const btn = document.getElementById('submit-btn');
  
  btn.disabled = true;

  if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
    spinner.style.display = 'none';
    failEl.style.display = 'flex';
    document.getElementById('submit-fail-msg').textContent =
      'The teacher has not connected the Google Sheet backend yet. Please show this to your teacher.';
    btn.disabled = false;
    return;
  }

  try {
    // Send POST to Google Sheet Apps Script web app
    await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data),
      mode: 'no-cors' // Allow post to cross-origin endpoint
    });

    // In 'no-cors' mode we cannot inspect the response status, so we assume success if no exception thrown
    spinner.style.display = 'none';
    successEl.style.display = 'flex';
    document.getElementById('submit-success-name').textContent = `${data.studentName} — your portfolio dossier has been received.`;
    document.getElementById('submit-ts').textContent = 'Received: ' + new Date().toLocaleString('en-AU');

    // Update main page status bar
    const status = document.getElementById('submit-status');
    if (status) {
      status.textContent = '✅ Submitted: ' + new Date().toLocaleTimeString('en-AU');
      status.style.color = 'var(--green)';
    }

    // Save submit state
    localStorage.setItem(SAVE_KEY + '_submitted', new Date().toISOString());

  } catch(err) {
    spinner.style.display = 'none';
    failEl.style.display = 'flex';
    document.getElementById('submit-fail-msg').textContent = 'Submission error: ' + err.message;
  } finally {
    btn.disabled = false;
  }
}

// ===== 10. STUDENT EXPORT SYSTEMS (EXCEL & PDF/DOC) =====

// Export the budget builder contents as a clean CSV file
function exportBudgetToCSV() {
  const currencyCode = (document.getElementById('budget-currency-code')?.value || 'USD').trim().toUpperCase();
  const exchangeRate = parseFloat(document.getElementById('budget-exchange-rate')?.value) || 1;
  const rateDirection = document.getElementById('budget-rate-direction')?.value || 'aud_to_foreign';
  
  let csvContent = "Category,Description,Cost (Foreign),Currency,Exchange Rate,Cost (AUD)\r\n";
  let baseTotal = 0;

  budgetItems.forEach(item => {
    let audCost = item.isAUDDirect ? (parseFloat(item.audCost) || 0) : convertForeignToAUD(item.foreignCost, exchangeRate, rateDirection);
    baseTotal += audCost;
    
    const cat = `"${(item.category || '').replace(/"/g, '""')}"`;
    const desc = `"${(item.description || '').replace(/"/g, '""')}"`;
    const foreign = item.isAUDDirect ? "0" : Number(item.foreignCost || 0).toFixed(2);
    const curr = item.isAUDDirect ? "AUD" : currencyCode;
    const rate = item.isAUDDirect ? "1.0" : exchangeRate.toFixed(4);
    const aud = audCost.toFixed(2);

    csvContent += `${cat},${desc},${foreign},${curr},${rate},${aud}\r\n`;
  });

  // Calculate contingency
  let contingency = parseFloat(document.getElementById('budget-contingency-override')?.value);
  if (isNaN(contingency)) {
    contingency = baseTotal * 0.08;
    if (contingency < 500) contingency = 500;
    if (contingency > 1000) contingency = 1000;
  }
  const grandTotal = baseTotal + contingency;

  csvContent += `\r\n`;
  csvContent += `,,,,,Base Travel Expenses,${baseTotal.toFixed(2)} AUD\r\n`;
  csvContent += `,,,,,Contingency Fund Buffer,${contingency.toFixed(2)} AUD\r\n`;
  csvContent += `,,,,,GRAND TOTAL SPEND,${grandTotal.toFixed(2)} AUD\r\n`;

  // Download trigger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${studentName.replace(/\s+/g,'_')}_Travel_Budget.csv`;
  
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

// Generate a clean, formal print window of the student dossier and call print (allows Save as PDF/Doc)
function exportDossierToPDF() {
  const data = collectAllData();
  const printWin = window.open('', '_blank');
  
  if (!printWin) {
    alert("Popup blocker blocked the download window. Please allow popups for this site and try again.");
    return;
  }

  // Build itinerary table HTML for print
  const duration = parseInt(data['trip-duration']) || 7;
  let itineraryRows = '';
  try {
    const itin = JSON.parse(data['itinerary-serialized'] || '{}');
    for (let i = 1; i <= duration; i++) {
      itineraryRows += `
        <tr>
          <td><strong>Day ${i}</strong></td>
          <td>${itin[`itinerary-day${i}-morning`] || ''}</td>
          <td>${itin[`itinerary-day${i}-afternoon`] || ''}</td>
          <td>${itin[`itinerary-day${i}-evening`] || ''}</td>
          <td>${itin[`itinerary-day${i}-overnight`] || ''}</td>
          <td style="text-align:center;">${itin[`itinerary-day${i}-cultural`] === 'true' ? 'Yes' : 'No'}</td>
        </tr>
      `;
    }
  } catch(e) {
    itineraryRows = '<tr><td colspan="6">No itinerary planned.</td></tr>';
  }

  // Build budget table HTML for print
  let budgetRows = '';
  let grandTotalAUD = 0;
  try {
    const budget = JSON.parse(data['budget-serialized'] || '{}');
    const rate = budget.exchangeRate || 1;
    const cur = budget.currencyCode || 'USD';
    const rateDir = budget.rateDirection || 'aud_to_foreign';
    let baseTotal = 0;
    
    (budget.items || []).forEach(item => {
      const itemAud = (item.audCost !== undefined && item.audCost !== null)
        ? Number(item.audCost)
        : (item.isAUDDirect ? 0 : convertForeignToAUD(item.foreignCost || 0, rate, rateDir));
      baseTotal += itemAud;
      budgetRows += `
        <tr>
          <td>${item.category}</td>
          <td>${item.description}</td>
          <td>${item.isAUDDirect ? '—' : (Number(item.foreignCost || 0).toFixed(2) + ' ' + cur)}</td>
          <td>${item.isAUDDirect ? '1.00' : rate.toFixed(4)}</td>
          <td>$${itemAud.toFixed(2)} AUD</td>
        </tr>
      `;
    });
    
    const contingency = budget.contingencyOverride !== undefined ? budget.contingencyOverride : (baseTotal * 0.08);
    grandTotalAUD = baseTotal + contingency;
    
    budgetRows += `
      <tr class="summary-line" style="border-top: 2px solid #000; font-weight:bold;">
        <td colspan="4" style="text-align:right;">Base Expenses:</td>
        <td>$${baseTotal.toFixed(2)} AUD</td>
      </tr>
      <tr class="summary-line" style="font-weight:bold;">
        <td colspan="4" style="text-align:right;">Contingency Fund Buffer:</td>
        <td>$${contingency.toFixed(2)} AUD</td>
      </tr>
      <tr class="summary-line" style="font-weight:bold; font-size:1.1em; border-bottom: 2px double #000;">
        <td colspan="4" style="text-align:right;">GRAND TOTAL SPEND:</td>
        <td>$${grandTotalAUD.toFixed(2)} AUD</td>
      </tr>
    `;
  } catch(e) {
    budgetRows = '<tr><td colspan="5">No budget items calculated.</td></tr>';
  }

  const travelThemeText = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Year 10 Commerce Travel Portfolio - ${data.studentName}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: 'Georgia', 'Times New Roman', serif; color: #111; line-height: 1.5; font-size: 11pt; background:#fff; }
        .print-header { text-align: center; border-bottom: 3px double #000; padding-bottom: 1rem; margin-bottom: 2rem; }
        .print-header h1 { font-family: 'Arial', sans-serif; font-size: 22pt; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
        .print-header h2 { font-family: 'Arial', sans-serif; font-size: 13pt; font-weight: normal; margin: 5px 0 15px; color: #555; }
        .student-details { display: table; width: 100%; border: 1px solid #000; padding: 10px; margin-bottom: 2rem; font-family: 'Arial', sans-serif; font-size: 10pt; }
        .sd-row { display: table-row; }
        .sd-cell { display: table-cell; padding: 4px 10px; }
        .section-header { font-family: 'Arial', sans-serif; font-size: 14pt; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; margin-top: 2rem; margin-bottom: 1rem; padding-bottom: 4px; page-break-after: avoid; }
        .field-box { margin-bottom: 1.2rem; }
        .field-label { font-family: 'Arial', sans-serif; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: #333; margin-bottom: 4px; }
        .field-value { font-size: 11pt; text-align: justify; margin-left: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; margin-bottom: 1.5rem; page-break-inside: avoid; }
        th { background: #f2f2f2; border: 1px solid #000; font-family: 'Arial', sans-serif; font-weight: bold; font-size: 9pt; padding: 6px 10px; text-transform: uppercase; text-align: left; }
        td { border: 1px solid #000; padding: 6px 10px; font-size: 9.5pt; vertical-align: top; }
        .quote-grid { display: flex; gap: 1.5rem; margin-bottom: 1rem; page-break-inside: avoid; }
        .quote-col { flex: 1; border: 1px solid #ccc; padding: 10px; border-radius: 4px; background: #fafafa; }
        .quote-title { font-family: 'Arial', sans-serif; font-weight: bold; font-size: 9.5pt; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>

      <div class="print-header">
        <h1>Assessment Task 3: Client Travel Dossier</h1>
        <h2>Year 10 Commerce — Travel Consultant Project</h2>
      </div>

      <div class="student-details">
        <div class="sd-row">
          <div class="sd-cell" style="width:15%"><strong>Student Name:</strong></div>
          <div class="sd-cell">${data.studentName}</div>
          <div class="sd-cell" style="width:15%"><strong>Due Date:</strong></div>
          <div class="sd-cell">Monday 18th Sept 3:30pm</div>
        </div>
        <div class="sd-row">
          <div class="sd-cell"><strong>Class Code:</strong></div>
          <div class="sd-cell">${data.classCode}</div>
          <div class="sd-cell"><strong>Weighting:</strong></div>
          <div class="sd-cell">25%</div>
        </div>
      </div>

      <!-- PART A -->
      <div class="section-header">Part A: Destination Profile &amp; Itinerary</div>
      
      <div class="quote-grid">
        <div class="quote-col" style="background:#fff; border: 1px solid #000;">
          <div class="field-label">Selected Destination</div>
          <div class="field-value">${data['dest-country'] || 'Not specified'}</div>
        </div>
        <div class="quote-col" style="background:#fff; border: 1px solid #000;">
          <div class="field-label">Primary Type of Tourism</div>
          <div class="field-value">${data['tourism-type'] || 'Not specified'}</div>
        </div>
      </div>

      <div class="field-box">
        <div class="field-label">Destination Suitability Justification (For 18–25 Age Demographic)</div>
        <div class="field-value">${data['dest-reason'] || 'Not entered.'}</div>
      </div>

      <div class="field-label" style="margin-top: 1.5rem;">7–${duration} Day Travel Itinerary Schedule</div>
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">Day</th>
            <th>Morning Plan</th>
            <th>Afternoon Activity</th>
            <th>Evening Plan</th>
            <th>Overnight Stay</th>
            <th style="width: 60px; text-align:center;">Cultural</th>
          </tr>
        </thead>
        <tbody>
          ${itineraryRows}
        </tbody>
      </table>

      <div class="page-break"></div>

      <!-- FLIGHT QUOTES -->
      <div class="field-label" style="margin-top: 1rem;">Comparative Return Flight Quotes (Sydney Departure)</div>
      <div class="quote-grid">
        <div class="quote-col">
          <div class="quote-title">Option 1 (Selected Airline)</div>
          <strong>Airline:</strong> ${data['flight1-airline'] || '—'}<br/>
          <strong>Flight Number:</strong> ${data['flight1-number'] || '—'}<br/>
          <strong>Baggage Limits:</strong> ${data['flight1-baggage'] || '—'}<br/>
          <strong>Total Price:</strong> $${data['flight1-price'] || '0'} AUD<br/>
          <strong>Link:</strong> <span style="font-size:8pt; word-break:break-all;">${data['flight1-link'] || '—'}</span>
        </div>
        <div class="quote-col">
          <div class="quote-title">Option 2 (Comparison)</div>
          <strong>Airline:</strong> ${data['flight2-airline'] || '—'}<br/>
          <strong>Flight Number:</strong> ${data['flight2-number'] || '—'}<br/>
          <strong>Baggage Limits:</strong> ${data['flight2-baggage'] || '—'}<br/>
          <strong>Total Price:</strong> $${data['flight2-price'] || '0'} AUD<br/>
          <strong>Link:</strong> <span style="font-size:8pt; word-break:break-all;">${data['flight2-link'] || '—'}</span>
        </div>
      </div>
      <div class="field-box">
        <div class="field-label">Flight Selection Justification</div>
        <div class="field-value">${data['flight-selection-reason'] || 'Not entered.'}</div>
      </div>

      <!-- ACCOMMODATION QUOTES -->
      <div class="field-label" style="margin-top: 1.5rem;">Comparative Accommodation Quotes</div>
      <div class="quote-grid">
        <div class="quote-col">
          <div class="quote-title">Option 1</div>
          <strong>Property:</strong> ${data['acc1-name'] || '—'}<br/>
          <strong>Location:</strong> ${data['acc1-location'] || '—'}<br/>
          <strong>Rate per Night:</strong> $${data['acc1-rate'] || '0'} AUD<br/>
          <strong>Link:</strong> <span style="font-size:8pt; word-break:break-all;">${data['acc1-link'] || '—'}</span>
        </div>
        <div class="quote-col">
          <div class="quote-title">Option 2</div>
          <strong>Property:</strong> ${data['acc2-name'] || '—'}<br/>
          <strong>Location:</strong> ${data['acc2-location'] || '—'}<br/>
          <strong>Rate per Night:</strong> $${data['acc2-rate'] || '0'} AUD<br/>
          <strong>Link:</strong> <span style="font-size:8pt; word-break:break-all;">${data['acc2-link'] || '—'}</span>
        </div>
      </div>
      <div class="field-box">
        <div class="field-label">Accommodation Selection Justification</div>
        <div class="field-value">${data['acc-selection-reason'] || 'Not entered.'}</div>
      </div>

      <div class="page-break"></div>

      <!-- PART B -->
      <div class="section-header">Part B: Financial Budget Summary</div>
      <div class="field-box">
        <div class="field-label">External Spreadsheet Link</div>
        <div class="field-value">
          <a href="${data['external-spreadsheet-url'] || '#'}" target="_blank">${data['external-spreadsheet-url'] || 'Not provided'}</a>
        </div>
      </div>
      <div class="field-label">Draft Budget Conversion Table</div>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Description</th>
            <th>Foreign Price</th>
            <th>Exchange Rate</th>
            <th>Cost (AUD)</th>
          </tr>
        </thead>
        <tbody>
          ${budgetRows}
        </tbody>
      </table>

      <!-- PART C -->
      <div class="section-header" style="margin-top: 2rem;">Part C: Smartraveller Due Diligence</div>
      <div class="quote-grid">
        <div class="quote-col" style="background:#fff; border: 1px solid #000;">
          <div class="field-label">DFAT Advisory Level</div>
          <div class="field-value"><strong>${data['smartraveller-level'] || 'Not specified'}</strong></div>
        </div>
        <div class="quote-col" style="background:#fff; border: 1px solid #000;">
          <div class="field-label">Passport Entry Rules</div>
          <div class="field-value">${data['passport-validity'] || 'Not specified'}</div>
        </div>
      </div>

      <div class="field-label">Local Safety Warnings Sourced</div>
      <ul style="margin-left: 1.5rem; margin-bottom: 1rem; font-size: 10pt;">
        <li>Warning 1: ${data['safety-warning-1'] || '—'}</li>
        <li>Warning 2: ${data['safety-warning-2'] || '—'}</li>
      </ul>

      <div class="field-box">
        <div class="field-label">Tourist Visa Requirements</div>
        <div class="field-value">${data['visa-requirement'] || '—'}</div>
      </div>

      <div class="quote-grid" style="margin-top: 1.5rem;">
        <div class="quote-col">
          <div class="quote-title">⚖️ Local Laws (Different from Australia)</div>
          1. ${data['local-law-1'] || '—'}<br/>
          2. ${data['local-law-2'] || '—'}
        </div>
        <div class="quote-col">
          <div class="quote-title">🤝 Cultural Customs / Dress Codes</div>
          1. ${data['cultural-custom-1'] || '—'}<br/>
          2. ${data['cultural-custom-2'] || '—'}
        </div>
      </div>

      <div class="field-label" style="margin-top: 1.5rem;">Comparative Travel Insurance Sourcing</div>
      <div class="quote-grid">
        <div class="quote-col">
          <div class="quote-title">Insurance Option 1</div>
          <strong>Provider:</strong> ${data['ins1-provider'] || '—'}<br/>
          <strong>Medical Cover:</strong> ${data['ins1-medical'] || '—'}<br/>
          <strong>Excess Fee:</strong> $${data['ins1-excess'] || '0'} AUD<br/>
          <strong>Premium:</strong> $${data['ins1-premium'] || '0'} AUD<br/>
          <strong>Link:</strong> <span style="font-size:8pt; word-break:break-all;">${data['ins1-link'] || '—'}</span>
        </div>
        <div class="quote-col">
          <div class="quote-title">Insurance Option 2</div>
          <strong>Provider:</strong> ${data['ins2-provider'] || '—'}<br/>
          <strong>Medical Cover:</strong> ${data['ins2-medical'] || '—'}<br/>
          <strong>Excess Fee:</strong> $${data['ins2-excess'] || '0'} AUD<br/>
          <strong>Premium:</strong> $${data['ins2-premium'] || '0'} AUD<br/>
          <strong>Link:</strong> <span style="font-size:8pt; word-break:break-all;">${data['ins2-link'] || '—'}</span>
        </div>
      </div>
      <div class="field-box">
        <div class="field-label">Chosen Policy and Selection Justification (Selected: ${data['ins-selected'] || '—'})</div>
        <div class="field-value">${data['ins-justification'] || '—'}</div>
      </div>

      <div class="page-break"></div>

      <!-- PART D -->
      <div class="section-header">Part D: Emergency Crisis Management Plan</div>
      <div class="field-box">
        <div class="field-label">Selected Scenario</div>
        <div class="field-value" style="font-weight:bold; color:#7f1d1d;">CHOICE: ${data['emergency-scenario'] ? data['emergency-scenario'].toUpperCase() : 'None selected'}</div>
      </div>
      
      <div class="field-box">
        <div class="field-label">First 24 Hours: Immediate Action Steps</div>
        <div class="field-value" style="border: 1px solid #ccc; padding: 10px; background: #fafafa; border-radius: 4px;">${data['em-step1'] || '—'}</div>
      </div>
      <div class="field-box">
        <div class="field-label">Embassy Support: What they can and cannot assist with</div>
        <div class="field-value" style="border: 1px solid #ccc; padding: 10px; background: #fafafa; border-radius: 4px;">${data['em-step2'] || '—'}</div>
      </div>
      <div class="field-box">
        <div class="field-label">Emergency Funds &amp; Claims: Contacting Insurer and Accessing Money</div>
        <div class="field-value" style="border: 1px solid #ccc; padding: 10px; background: #fafafa; border-radius: 4px;">${data['em-step3'] || '—'}</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        }
      </script>
    </body>
    </html>
  `;
  
  printWin.document.write(travelThemeText);
  printWin.document.close();
}

// Generate an offline Word Document (.doc) pre-populated with student entries
function exportDossierToWord() {
  const data = collectAllData();
  
  // Build itinerary table HTML for print
  const duration = parseInt(data['trip-duration']) || 7;
  let itineraryRows = '';
  try {
    const itin = JSON.parse(data['itinerary-serialized'] || '{}');
    for (let i = 1; i <= duration; i++) {
      itineraryRows += `
        <tr>
          <td>Day ${i}</td>
          <td>${itin[`itinerary-day${i}-morning`] || ''}</td>
          <td>${itin[`itinerary-day${i}-afternoon`] || ''}</td>
          <td>${itin[`itinerary-day${i}-evening`] || ''}</td>
          <td>${itin[`itinerary-day${i}-overnight`] || ''}</td>
          <td style="text-align:center;">${itin[`itinerary-day${i}-cultural`] === 'true' ? 'Yes' : 'No'}</td>
        </tr>
      `;
    }
  } catch(e) {
    itineraryRows = '<tr><td colspan="6">No itinerary planned.</td></tr>';
  }

  // Build budget table HTML for print
  let budgetRows = '';
  let grandTotalAUD = 0;
  try {
    const budget = JSON.parse(data['budget-serialized'] || '{}');
    const rate = budget.exchangeRate || 1;
    const cur = budget.currencyCode || 'USD';
    const rateDir = budget.rateDirection || 'aud_to_foreign';
    let baseTotal = 0;
    
    (budget.items || []).forEach(item => {
      const itemAud = (item.audCost !== undefined && item.audCost !== null)
        ? Number(item.audCost)
        : (item.isAUDDirect ? 0 : convertForeignToAUD(item.foreignCost || 0, rate, rateDir));
      baseTotal += itemAud;
      budgetRows += `
        <tr>
          <td>${item.category}</td>
          <td>${item.description}</td>
          <td>${item.isAUDDirect ? '—' : (Number(item.foreignCost || 0).toFixed(2) + ' ' + cur)}</td>
          <td>${item.isAUDDirect ? '1.00' : rate.toFixed(4)}</td>
          <td>$${itemAud.toFixed(2)} AUD</td>
        </tr>
      `;
    });
    
    const contingency = budget.contingencyOverride !== undefined ? budget.contingencyOverride : (baseTotal * 0.08);
    grandTotalAUD = baseTotal + contingency;
    
    budgetRows += `
      <tr style="font-weight:bold;">
        <td colspan="4" style="text-align:right;">Base Expenses:</td>
        <td>$${baseTotal.toFixed(2)} AUD</td>
      </tr>
      <tr style="font-weight:bold;">
        <td colspan="4" style="text-align:right;">Contingency Fund Buffer:</td>
        <td>$${contingency.toFixed(2)} AUD</td>
      </tr>
      <tr style="font-weight:bold; font-size:1.1em;">
        <td colspan="4" style="text-align:right;">GRAND TOTAL SPEND:</td>
        <td>$${grandTotalAUD.toFixed(2)} AUD</td>
      </tr>
    `;
  } catch(e) {
    budgetRows = '<tr><td colspan="5">No budget items calculated.</td></tr>';
  }

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>Year 10 Commerce Travel Portfolio - ${data.studentName}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Arial', sans-serif; color: #111; line-height: 1.5; font-size: 11pt; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 25px; }
        .header h1 { font-size: 20pt; margin: 0; text-transform: uppercase; color: #0f172a; }
        .header h2 { font-size: 12pt; color: #475569; margin: 5px 0 0 0; }
        .student-details { width: 100%; border: 1px solid #cbd5e1; border-collapse: collapse; margin-bottom: 25px; }
        .student-details td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 10pt; background: #f8fafc; }
        .section-title { background: #0f172a; color: #ffffff; padding: 8px 12px; font-size: 13pt; font-weight: bold; margin-top: 30px; margin-bottom: 15px; border-radius: 4px; text-transform: uppercase; }
        .field-label { font-weight: bold; font-size: 10pt; color: #0f172a; margin-top: 15px; margin-bottom: 4px; text-transform: uppercase; }
        .write-box { border: 1px dashed #94a3b8; background: #faf5ff; min-height: 60px; padding: 10px; border-radius: 4px; margin-bottom: 15px; }
        .paste-box { border: 2px dashed #38bdf8; background: #f0f9ff; min-height: 120px; text-align: center; color: #0369a1; font-size: 9.5pt; font-weight: bold; padding: 15px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
        th { background: #f1f5f9; border: 1px solid #94a3b8; font-weight: bold; font-size: 9.5pt; padding: 8px 10px; text-align: left; }
        td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 9.5pt; vertical-align: top; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Client Travel Dossier</h1>
        <h2>Year 10 Commerce — Assessment Task 3: Travel Consultant</h2>
      </div>

      <table class="student-details">
        <tr>
          <td style="width: 20%;"><strong>Student Name:</strong></td>
          <td style="width: 30%;">${data.studentName}</td>
          <td style="width: 20%;"><strong>Due Date:</strong></td>
          <td style="width: 30%;">Monday 18th September Week 9</td>
        </tr>
        <tr>
          <td><strong>Class Roll/Code:</strong></td>
          <td>${data.classCode}</td>
          <td><strong>Assessment Weight:</strong></td>
          <td>25%</td>
        </tr>
      </table>

      <div class="section-title">Part A: Destination Profile, Schedule &amp; Quotes</div>
      
      <div class="field-label">1. Selected Destination Country/City</div>
      <div class="write-box">${data['dest-country'] || '[Not specified]'}</div>

      <div class="field-label">2. Primary Classification of Tourism</div>
      <div class="write-box">${data['tourism-type'] || '[Not specified]'}</div>

      <div class="field-label">3. Destination Justification (3–4 sentences)</div>
      <div class="write-box">${data['dest-reason'] || '[Not entered]'}</div>

      <div class="field-label">4. 7–${duration} Day Itinerary Table</div>
      <table>
        <thead>
          <tr>
            <th style="width: 8%;">Day</th>
            <th style="width: 22%;">Morning Plan</th>
            <th style="width: 22%;">Afternoon Activity</th>
            <th style="width: 22%;">Evening Plan</th>
            <th style="width: 18%;">Stay Overnight</th>
            <th style="width: 8%; text-align:center;">Cultural?</th>
          </tr>
        </thead>
        <tbody>
          ${itineraryRows}
        </tbody>
      </table>

      <div class="page-break"></div>

      <div class="field-label">5. Sourced Return Flight Quotes (Sydney departure)</div>
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Flight Option 1 (Selected)</th>
            <th style="width: 50%;">Flight Option 2 (Comparison)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Airline:</strong> ${data['flight1-airline'] || '—'}<br/>
              <strong>Flight Number(s):</strong> ${data['flight1-number'] || '—'}<br/>
              <strong>Baggage Rules:</strong> ${data['flight1-baggage'] || '—'}<br/>
              <strong>Total Price (AUD):</strong> $${data['flight1-price'] || '0'}<br/>
              <strong>Booking Web Link:</strong> ${data['flight1-link'] || '—'}
            </td>
            <td>
              <strong>Airline:</strong> ${data['flight2-airline'] || '—'}<br/>
              <strong>Flight Number(s):</strong> ${data['flight2-number'] || '—'}<br/>
              <strong>Baggage Rules:</strong> ${data['flight2-baggage'] || '—'}<br/>
              <strong>Total Price (AUD):</strong> $${data['flight2-price'] || '0'}<br/>
              <strong>Booking Web Link:</strong> ${data['flight2-link'] || '—'}
            </td>
          </tr>
          <tr>
            <td class="paste-box">[PASTE SCREENSHOT OF FLIGHT 1 QUOTE HERE]</td>
            <td class="paste-box">[PASTE SCREENSHOT OF FLIGHT 2 QUOTE HERE]</td>
          </tr>
        </tbody>
      </table>

      <div class="field-label">Flight Selection Justification</div>
      <div class="write-box">${data['flight-selection-reason'] || '[Not entered]'}</div>

      <div class="field-label">6. Sourced Accommodation Quotes</div>
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Accommodation Option 1 (Selected)</th>
            <th style="width: 50%;">Accommodation Option 2 (Comparison)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Property Name:</strong> ${data['acc1-name'] || '—'}<br/>
              <strong>Location/Area:</strong> ${data['acc1-location'] || '—'}<br/>
              <strong>Price per Night (AUD):</strong> $${data['acc1-rate'] || '0'}<br/>
              <strong>Website Link:</strong> ${data['acc1-link'] || '—'}
            </td>
            <td>
              <strong>Property Name:</strong> ${data['acc2-name'] || '—'}<br/>
              <strong>Location/Area:</strong> ${data['acc2-location'] || '—'}<br/>
              <strong>Price per Night (AUD):</strong> $${data['acc2-rate'] || '0'}<br/>
              <strong>Website Link:</strong> ${data['acc2-link'] || '—'}
            </td>
          </tr>
          <tr>
            <td class="paste-box">[PASTE SCREENSHOT OF ACCOMMODATION 1 HERE]</td>
            <td class="paste-box">[PASTE SCREENSHOT OF ACCOMMODATION 2 HERE]</td>
          </tr>
        </tbody>
      </table>

      <div class="field-label">Accommodation Selection Justification</div>
      <div class="write-box">${data['acc-selection-reason'] || '[Not entered]'}</div>

      <div class="page-break"></div>

      <div class="section-title">Part C: Smartraveller, Local Rules &amp; Insurance</div>
      
      <div class="field-label">1. Official DFAT Safety Advice Level</div>
      <div class="write-box">${data['smartraveller-level'] || '[Not specified]'}</div>

      <div class="field-label">2. Specific Safety Warnings</div>
      <div class="write-box">
        1. ${data['safety-warning-1'] || '—'}<br/>
        2. ${data['safety-warning-2'] || '—'}
      </div>

      <div class="field-label">3. Entry Rules &amp; Passport Validity</div>
      <div class="write-box">
        <strong>Passport Validity:</strong> ${data['passport-validity'] || '—'}<br/>
        <strong>Visa Requirements:</strong> ${data['visa-requirement'] || '—'}
      </div>

      <div class="field-label">4. Local Laws &amp; Cultural Customs</div>
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Local Laws</th>
            <th style="width: 50%;">Cultural Customs</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              1. ${data['local-law-1'] || '—'}<br/>
              2. ${data['local-law-2'] || '—'}
            </td>
            <td>
              1. ${data['cultural-custom-1'] || '—'}<br/>
              2. ${data['cultural-custom-2'] || '—'}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="field-label">5. Travel Insurance Sourcing</div>
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Insurance Option 1</th>
            <th style="width: 50%;">Insurance Option 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Provider:</strong> ${data['ins1-provider'] || '—'}<br/>
              <strong>Medical Cover:</strong> ${data['ins1-medical'] || '—'}<br/>
              <strong>Excess Fee:</strong> $${data['ins1-excess'] || '0'}<br/>
              <strong>Premium Cost:</strong> $${data['ins1-premium'] || '0'}<br/>
              <strong>Link:</strong> ${data['ins1-link'] || '—'}
            </td>
            <td>
              <strong>Provider:</strong> ${data['ins2-provider'] || '—'}<br/>
              <strong>Medical Cover:</strong> ${data['ins2-medical'] || '—'}<br/>
              <strong>Excess Fee:</strong> $${data['ins2-excess'] || '0'}<br/>
              <strong>Premium Cost:</strong> $${data['ins2-premium'] || '0'}<br/>
              <strong>Link:</strong> ${data['ins2-link'] || '—'}
            </td>
          </tr>
          <tr>
            <td class="paste-box">[PASTE SCREENSHOT OF INSURANCE QUOTE 1 HERE]</td>
            <td class="paste-box">[PASTE SCREENSHOT OF INSURANCE QUOTE 2 HERE]</td>
          </tr>
        </tbody>
      </table>

      <div class="field-label">Insurance Justification (Selected: ${data['ins-selected'] || '—'})</div>
      <div class="write-box">${data['ins-justification'] || '[Not entered]'}</div>

      <div class="page-break"></div>

      <div class="section-title">Part D: Emergency Crisis Management</div>
      
      <div class="field-label">Selected Scenario</div>
      <div class="write-box" style="font-weight:bold; color:#7f1d1d;">CHOICE: ${data['emergency-scenario'] ? data['emergency-scenario'].toUpperCase() : 'None selected'}</div>

      <div class="field-label">Step 1: First 24 Hours (Immediate Actions)</div>
      <div class="write-box" style="min-height: 100px;">${data['em-step1'] || '[Not entered]'}</div>

      <div class="field-label">Step 2: The Australian Embassy (Consular Assistance)</div>
      <div class="write-box" style="min-height: 100px;">${data['em-step2'] || '[Not entered]'}</div>

      <div class="field-label">Step 3: Emergency Funds &amp; Claims</div>
      <div class="write-box" style="min-height: 100px;">${data['em-step3'] || '[Not entered]'}</div>
    </body>
    </html>
  `;

  // Download trigger as MS Word file (.doc extension wrapping HTML styles)
  const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword' });
  const filename = `${studentName.replace(/\s+/g,'_')}_Travel_Dossier.doc`;
  
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename);
  } else {
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

// ===== GOOGLE DOCS EXPORT SYSTEM =====
async function exportDossierToGoogleDocs() {
  const data = collectAllData();

  // 1. Build itinerary rows
  const duration = parseInt(data['trip-duration']) || 7;
  let itineraryRows = '';
  try {
    const itin = JSON.parse(data['itinerary-serialized'] || '{}');
    for (let i = 1; i <= duration; i++) {
      itineraryRows += `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: bold;">Day ${i}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">${itin[`itinerary-day${i}-morning`] || ''}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">${itin[`itinerary-day${i}-afternoon`] || ''}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">${itin[`itinerary-day${i}-evening`] || ''}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">${itin[`itinerary-day${i}-overnight`] || ''}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align:center;">${itin[`itinerary-day${i}-cultural`] === 'true' ? 'Yes' : 'No'}</td>
        </tr>
      `;
    }
  } catch(e) {
    itineraryRows = '<tr><td colspan="6" style="border: 1px solid #cbd5e1; padding: 8px 10px;">No itinerary planned.</td></tr>';
  }

  // 2. Build budget rows
  let budgetRows = '';
  let grandTotalAUD = 0;
  try {
    const budget = JSON.parse(data['budget-serialized'] || '{}');
    const rate = budget.exchangeRate || 1;
    const cur = budget.currencyCode || 'USD';
    const rateDir = budget.rateDirection || 'aud_to_foreign';
    let baseTotal = 0;
    
    (budget.items || []).forEach(item => {
      const itemAud = (item.audCost !== undefined && item.audCost !== null)
        ? Number(item.audCost)
        : (item.isAUDDirect ? 0 : convertForeignToAUD(item.foreignCost || 0, rate, rateDir));
      baseTotal += itemAud;
      budgetRows += `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">${item.category}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">${item.description}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">${item.isAUDDirect ? '—' : (Number(item.foreignCost || 0).toFixed(2) + ' ' + cur)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">${item.isAUDDirect ? '1.00' : rate.toFixed(4)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: bold;">$${itemAud.toFixed(2)} AUD</td>
        </tr>
      `;
    });
    
    const contingency = budget.contingencyOverride !== undefined ? budget.contingencyOverride : (baseTotal * 0.08);
    grandTotalAUD = baseTotal + contingency;
    
    budgetRows += `
      <tr style="font-weight:bold; background: #f8fafc;">
        <td colspan="4" style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align:right;">Base Expenses:</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">$${baseTotal.toFixed(2)} AUD</td>
      </tr>
      <tr style="font-weight:bold; background: #f8fafc;">
        <td colspan="4" style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align:right;">Contingency Fund Buffer:</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">$${contingency.toFixed(2)} AUD</td>
      </tr>
      <tr style="font-weight:bold; font-size:1.1em; background: #e0f2fe;">
        <td colspan="4" style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align:right;">GRAND TOTAL SPEND:</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px 10px; color: #0369a1;">$${grandTotalAUD.toFixed(2)} AUD</td>
      </tr>
    `;
  } catch(e) {
    budgetRows = '<tr><td colspan="5" style="border: 1px solid #cbd5e1; padding: 8px 10px;">No budget items calculated.</td></tr>';
  }

  // 3. Build Google Docs formatted HTML
  const gdocsHtml = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; font-size: 11pt; max-width: 800px; margin: 0 auto;">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
        <h1 style="font-size: 22pt; margin: 0; text-transform: uppercase; color: #0f172a;">Client Travel Dossier</h1>
        <h2 style="font-size: 12pt; color: #475569; margin: 5px 0 0 0; font-weight: normal;">Year 10 Commerce — Assessment Task 3: Travel Consultant</h2>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt;">
        <tr>
          <td style="width: 25%; border: 1px solid #cbd5e1; padding: 8px 12px; background: #f8fafc;"><strong>Student Name:</strong></td>
          <td style="width: 25%; border: 1px solid #cbd5e1; padding: 8px 12px;">${data.studentName}</td>
          <td style="width: 25%; border: 1px solid #cbd5e1; padding: 8px 12px; background: #f8fafc;"><strong>Due Date:</strong></td>
          <td style="width: 25%; border: 1px solid #cbd5e1; padding: 8px 12px;">Monday 18th September Week 9</td>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px; background: #f8fafc;"><strong>Class Roll / Code:</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">${data.classCode}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px; background: #f8fafc;"><strong>Assessment Weight:</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">25%</td>
        </tr>
      </table>

      <h2 style="background: #0f172a; color: #ffffff; padding: 8px 12px; font-size: 13pt; margin-top: 25px; margin-bottom: 15px; border-radius: 4px; text-transform: uppercase;">Part A: Destination Profile, Schedule &amp; Quotes</h2>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">1. Selected Destination Country/City</p>
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 12px; border-radius: 4px; margin-bottom: 15px;">${data['dest-country'] || '[Not specified]'}</div>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">2. Primary Classification of Tourism</p>
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 12px; border-radius: 4px; margin-bottom: 15px;">${data['tourism-type'] || '[Not specified]'}</div>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">3. Destination Justification (3–4 sentences)</p>
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 12px; border-radius: 4px; margin-bottom: 15px;">${data['dest-reason'] || '[Not entered]'}</div>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">4. 7–${duration} Day Itinerary Table</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9.5pt;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 8%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Day</th>
            <th style="width: 22%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Morning Plan</th>
            <th style="width: 22%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Afternoon Activity</th>
            <th style="width: 22%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Evening Plan</th>
            <th style="width: 18%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Stay Overnight</th>
            <th style="width: 8%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center;">Cultural?</th>
          </tr>
        </thead>
        <tbody>
          ${itineraryRows}
        </tbody>
      </table>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">5. Sourced Return Flight Quotes (Sydney departure)</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9.5pt;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 50%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Flight Option 1 (Selected)</th>
            <th style="width: 50%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Flight Option 2 (Comparison)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top;">
              <strong>Airline:</strong> ${data['flight1-airline'] || '—'}<br/>
              <strong>Flight Number(s):</strong> ${data['flight1-number'] || '—'}<br/>
              <strong>Baggage Rules:</strong> ${data['flight1-baggage'] || '—'}<br/>
              <strong>Total Price (AUD):</strong> $${data['flight1-price'] || '0'}<br/>
              <strong>Booking Link:</strong> ${data['flight1-link'] || '—'}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top;">
              <strong>Airline:</strong> ${data['flight2-airline'] || '—'}<br/>
              <strong>Flight Number(s):</strong> ${data['flight2-number'] || '—'}<br/>
              <strong>Baggage Rules:</strong> ${data['flight2-baggage'] || '—'}<br/>
              <strong>Total Price (AUD):</strong> $${data['flight2-price'] || '0'}<br/>
              <strong>Booking Link:</strong> ${data['flight2-link'] || '—'}
            </td>
          </tr>
          <tr>
            <td style="border: 2px dashed #0284c7; background: #f0f9ff; padding: 15px; text-align: center; color: #0369a1; font-weight: bold; font-size: 9pt;">[PASTE SCREENSHOT OF FLIGHT 1 QUOTE HERE]</td>
            <td style="border: 2px dashed #0284c7; background: #f0f9ff; padding: 15px; text-align: center; color: #0369a1; font-weight: bold; font-size: 9pt;">[PASTE SCREENSHOT OF FLIGHT 2 QUOTE HERE]</td>
          </tr>
        </tbody>
      </table>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">Flight Selection Justification</p>
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 12px; border-radius: 4px; margin-bottom: 15px;">${data['flight-selection-reason'] || '[Not entered]'}</div>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">6. Sourced Accommodation Quotes</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9.5pt;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 50%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Accommodation Option 1 (Selected)</th>
            <th style="width: 50%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Accommodation Option 2 (Comparison)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top;">
              <strong>Property Name:</strong> ${data['acc1-name'] || '—'}<br/>
              <strong>Location/Area:</strong> ${data['acc1-location'] || '—'}<br/>
              <strong>Price per Night (AUD):</strong> $${data['acc1-rate'] || '0'}<br/>
              <strong>Website Link:</strong> ${data['acc1-link'] || '—'}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top;">
              <strong>Property Name:</strong> ${data['acc2-name'] || '—'}<br/>
              <strong>Location/Area:</strong> ${data['acc2-location'] || '—'}<br/>
              <strong>Price per Night (AUD):</strong> $${data['acc2-rate'] || '0'}<br/>
              <strong>Website Link:</strong> ${data['acc2-link'] || '—'}
            </td>
          </tr>
          <tr>
            <td style="border: 2px dashed #0284c7; background: #f0f9ff; padding: 15px; text-align: center; color: #0369a1; font-weight: bold; font-size: 9pt;">[PASTE SCREENSHOT OF ACCOMMODATION 1 HERE]</td>
            <td style="border: 2px dashed #0284c7; background: #f0f9ff; padding: 15px; text-align: center; color: #0369a1; font-weight: bold; font-size: 9pt;">[PASTE SCREENSHOT OF ACCOMMODATION 2 HERE]</td>
          </tr>
        </tbody>
      </table>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">Accommodation Selection Justification</p>
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 12px; border-radius: 4px; margin-bottom: 15px;">${data['acc-selection-reason'] || '[Not entered]'}</div>

      <h2 style="background: #0f172a; color: #ffffff; padding: 8px 12px; font-size: 13pt; margin-top: 25px; margin-bottom: 15px; border-radius: 4px; text-transform: uppercase;">Part B: Itemised Travel Budget</h2>
      <p style="font-size: 9.5pt; color: #475569; margin-bottom: 8px;">Exchange Rate used: 1 AUD = ${data['budget-exchange-rate'] || '1'} ${data['budget-currency-code'] || 'USD'}</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9.5pt;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Category</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Description</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Foreign Price</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Rate</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Cost (AUD)</th>
          </tr>
        </thead>
        <tbody>
          ${budgetRows}
        </tbody>
      </table>
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 8px 12px; border-radius: 4px; font-size: 9.5pt; margin-bottom: 15px;">
        <strong>External Spreadsheet Link:</strong> ${data['external-spreadsheet-url'] ? `<a href="${data['external-spreadsheet-url']}" target="_blank">${data['external-spreadsheet-url']}</a>` : '[None submitted]'}
      </div>

      <h2 style="background: #0f172a; color: #ffffff; padding: 8px 12px; font-size: 13pt; margin-top: 25px; margin-bottom: 15px; border-radius: 4px; text-transform: uppercase;">Part C: Smartraveller, Local Rules &amp; Insurance</h2>
      
      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">1. Official DFAT Safety Advice Level</p>
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 12px; border-radius: 4px; margin-bottom: 15px;">${data['smartraveller-level'] || '[Not specified]'}</div>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">2. Specific Safety Warnings</p>
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 12px; border-radius: 4px; margin-bottom: 15px;">
        1. ${data['safety-warning-1'] || '—'}<br/>
        2. ${data['safety-warning-2'] || '—'}
      </div>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">3. Entry Rules &amp; Passport Validity</p>
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 12px; border-radius: 4px; margin-bottom: 15px;">
        <strong>Passport Validity:</strong> ${data['passport-validity'] || '—'}<br/>
        <strong>Visa Requirements:</strong> ${data['visa-requirement'] || '—'}
      </div>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">4. Local Laws &amp; Cultural Customs</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9.5pt;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 50%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Local Laws (Different from Australia)</th>
            <th style="width: 50%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Cultural Customs / Dress Codes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top;">
              1. ${data['local-law-1'] || '—'}<br/>
              2. ${data['local-law-2'] || '—'}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top;">
              1. ${data['cultural-custom-1'] || '—'}<br/>
              2. ${data['cultural-custom-2'] || '—'}
            </td>
          </tr>
        </tbody>
      </table>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">5. Travel Insurance Sourcing</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9.5pt;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 50%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Insurance Option 1</th>
            <th style="width: 50%; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left;">Insurance Option 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top;">
              <strong>Provider:</strong> ${data['ins1-provider'] || '—'}<br/>
              <strong>Medical Cover:</strong> ${data['ins1-medical'] || '—'}<br/>
              <strong>Excess Fee:</strong> $${data['ins1-excess'] || '0'}<br/>
              <strong>Premium Cost:</strong> $${data['ins1-premium'] || '0'}<br/>
              <strong>Link:</strong> ${data['ins1-link'] || '—'}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top;">
              <strong>Provider:</strong> ${data['ins2-provider'] || '—'}<br/>
              <strong>Medical Cover:</strong> ${data['ins2-medical'] || '—'}<br/>
              <strong>Excess Fee:</strong> $${data['ins2-excess'] || '0'}<br/>
              <strong>Premium Cost:</strong> $${data['ins2-premium'] || '0'}<br/>
              <strong>Link:</strong> ${data['ins2-link'] || '—'}
            </td>
          </tr>
          <tr>
            <td style="border: 2px dashed #0284c7; background: #f0f9ff; padding: 15px; text-align: center; color: #0369a1; font-weight: bold; font-size: 9pt;">[PASTE SCREENSHOT OF INSURANCE QUOTE 1 HERE]</td>
            <td style="border: 2px dashed #0284c7; background: #f0f9ff; padding: 15px; text-align: center; color: #0369a1; font-weight: bold; font-size: 9pt;">[PASTE SCREENSHOT OF INSURANCE QUOTE 2 HERE]</td>
          </tr>
        </tbody>
      </table>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">Insurance Justification (Selected: ${data['ins-selected'] || '—'})</p>
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 12px; border-radius: 4px; margin-bottom: 15px;">${data['ins-justification'] || '[Not entered]'}</div>

      <h2 style="background: #0f172a; color: #ffffff; padding: 8px 12px; font-size: 13pt; margin-top: 25px; margin-bottom: 15px; border-radius: 4px; text-transform: uppercase;">Part D: Emergency Crisis Management</h2>
      
      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">Selected Crisis Scenario</p>
      <div style="border: 1px solid #cbd5e1; background: #fef2f2; color: #991b1b; padding: 10px 12px; border-radius: 4px; font-weight: bold; margin-bottom: 15px;">
        CHOICE: ${data['emergency-scenario'] ? data['emergency-scenario'].toUpperCase() : 'None selected'}
      </div>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">Step 1: First 24 Hours (Immediate Actions)</p>
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 12px; border-radius: 4px; margin-bottom: 15px; min-height: 60px;">${data['em-step1'] || '[Not entered]'}</div>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">Step 2: The Australian Embassy (Consular Assistance)</p>
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 12px; border-radius: 4px; margin-bottom: 15px; min-height: 60px;">${data['em-step2'] || '[Not entered]'}</div>

      <p style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 10pt;">Step 3: Emergency Funds &amp; Insurance Claims</p>
      <div style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 12px; border-radius: 4px; margin-bottom: 15px; min-height: 60px;">${data['em-step3'] || '[Not entered]'}</div>
    </div>
  `;

  // 4. Copy formatted HTML to clipboard
  const plainText = `Client Travel Dossier - Year 10 Commerce Travel Consultant\nStudent: ${data.studentName}\nDestination: ${data['dest-country'] || 'Not set'}\n\nPlease paste into Google Docs (Ctrl+V) to view formatted tables and sections.`;
  await copyHtmlToClipboard(gdocsHtml, plainText);

  // 5. Download Google Docs compatible file
  const filename = `${studentName.replace(/\s+/g,'_')}_Travel_Dossier_GoogleDocs.doc`;
  const blob = new Blob(['\ufeff' + gdocsHtml], { type: 'application/msword' });
  
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename);
  } else {
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // 6. Show helpful modal
  const nameEl = document.getElementById('gdocs-download-name');
  if (nameEl) nameEl.textContent = filename;
  const modal = document.getElementById('gdocs-modal-overlay');
  if (modal) modal.style.display = 'flex';
}

function closeGDocsModal() {
  const modal = document.getElementById('gdocs-modal-overlay');
  if (modal) modal.style.display = 'none';
}

async function copyHtmlToClipboard(html, plainText) {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText
        })
      ]);
      return true;
    }
  } catch (err) {
    console.warn("ClipboardItem write failed, trying fallback", err);
  }

  // Fallback for browsers with strict clipboard restrictions
  try {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.style.position = 'fixed';
    div.style.left = '-9999px';
    div.style.top = '0';
    div.setAttribute('contenteditable', 'true');
    document.body.appendChild(div);
    div.focus();
    
    const range = document.createRange();
    range.selectNodeContents(div);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    const successful = document.execCommand('copy');
    document.body.removeChild(div);
    return successful;
  } catch (e) {
    console.warn("Fallback copy failed", e);
    return false;
  }
}


