// ===================================================
// YEAR 10 COMMERCE TRAVEL — GOOGLE APPS SCRIPT
// Paste this code into your Google Sheet's Apps Script editor:
// 1. In Google Sheets, click Extensions -> Apps Script
// 2. Erase everything and paste this entire file
// 3. Update the TEACHER_PASSWORD below if desired
// 4. Click Save
// 5. Click Deploy -> New deployment -> Select type: Web App
//    - Description: Year 10 Commerce Travel Submissions
//    - Execute as: Me (your email)
//    - Who has access: Anyone
// 6. Click Deploy and copy the Web App URL.
// 7. Paste that URL into config.js under SCRIPT_URL.
// ===================================================

var TEACHER_PASSWORD = 'travel10';
var SHEET_NAME = 'Submissions';

function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : '';
    if (!raw) {
      return response({ success: false, error: 'No data received' });
    }
    
    var data = JSON.parse(raw);
    var ss = getOrCreateSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    let headers = [];
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      var keys = Object.keys(data);
      keys = keys.filter(function(k) { return k !== 'studentName' && k !== 'timestamp' && k !== 'classCode'; });
      headers = ['timestamp', 'studentName', 'classCode'].concat(keys);
      
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
           .setFontWeight('bold')
           .setBackground('#0d2e27') // Deep teal header
           .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    } else {
      var lastCol = sheet.getLastColumn();
      var existingHeaders = [];
      if (lastCol > 0) {
        existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
      }
      
      // Check for any new keys in data that are not yet column headers
      var dataKeys = Object.keys(data);
      var newKeys = dataKeys.filter(function(k) {
        return existingHeaders.indexOf(k) === -1;
      });

      if (newKeys.length > 0) {
        var startCol = existingHeaders.length + 1;
        var newHeadersRange = sheet.getRange(1, startCol, 1, newKeys.length);
        newHeadersRange.setValues([newKeys]);
        newHeadersRange.setFontWeight('bold')
                       .setBackground('#0d2e27')
                       .setFontColor('#ffffff');
        headers = existingHeaders.concat(newKeys);
      } else {
        headers = existingHeaders;
      }
    }
    
    // Check if student has already submitted to overwrite their existing row (prevents duplicates)
    var lastRow = sheet.getLastRow();
    var studentRowIndex = -1;
    if (lastRow > 1) {
      var namesColumnIndex = headers.indexOf('studentName') + 1;
      if (namesColumnIndex > 0) {
        var names = sheet.getRange(2, namesColumnIndex, lastRow - 1, 1).getValues().map(function(r) {
          return String(r[0]).trim().toLowerCase();
        });
        var incomingName = String(data.studentName || '').trim().toLowerCase();
        if (incomingName) {
          var existingIdx = names.indexOf(incomingName);
          if (existingIdx !== -1) {
            studentRowIndex = existingIdx + 2; // Row index is 2-indexed relative to headers + 1-indexed relative to sheets
          }
        }
      }
    }
    
    // Map values to matching column headers
    var rowValues = headers.map(function(h) {
      if (h === 'timestamp') return new Date().toISOString();
      return data[h] !== undefined ? String(data[h]) : "";
    });
    
    if (studentRowIndex !== -1) {
      sheet.getRange(studentRowIndex, 1, 1, headers.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
    
    return response({ success: true });
  } catch (err) {
    return response({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  try {
    var pass = e.parameter.password;
    var action = e.parameter.action;
    
    if (pass !== TEACHER_PASSWORD) {
      return response({ success: false, error: 'Unauthorized' });
    }
    
    if (action === 'read') {
      var ss = getOrCreateSpreadsheet();
      var sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) {
        return response({ success: true, submissions: [] });
      }
      
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      if (lastRow < 2 || lastCol < 1) {
        return response({ success: true, submissions: [] });
      }
      
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
      var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
      var values = dataRange.getValues();
      
      var submissions = [];
      for (var r = 0; r < values.length; r++) {
        var sub = {};
        for (var c = 0; c < headers.length; c++) {
          sub[headers[c]] = values[r][c];
        }
        submissions.push(sub);
      }
      
      return response({ success: true, submissions: submissions });
    }
    
    return response({ success: false, error: 'Invalid action parameter' });
  } catch (err) {
    return response({ success: false, error: err.toString() });
  }
}

function getOrCreateSpreadsheet() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch(e) {}
  
  if (ss) {
    return ss;
  }
  
  // If running stand-alone (getActiveSpreadsheet returns null), create or find by name
  var sheets = DriveApp.getFilesByName("Year 10 Commerce Travel Submissions");
  if (sheets.hasNext()) {
    return SpreadsheetApp.open(sheets.next());
  }
  return SpreadsheetApp.create("Year 10 Commerce Travel Submissions");
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}
