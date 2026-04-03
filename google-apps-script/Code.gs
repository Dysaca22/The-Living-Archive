/**
 * Google Apps Script (Code.gs)
 * Reverse Proxy for The Living Archive
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Paste this code into Code.gs.
 * 4. Click "Deploy" > "New Deployment".
 * 5. Select "Web App".
 * 6. Execute as: "Me".
 * 7. Who has access: "Anyone".
 * 8. Copy the Web App URL and add it to your .env file as VITE_GOOGLE_SHEETS_WEB_APP_URL.
 */

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
    
    return createJsonResponse({ status: 'success', data: result });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { action, title, year, id } = payload;
    
    if (action === 'saveMovie') {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      
      // If sheet is empty, add headers
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['id', 'title', 'year', 'timestamp']);
      }
      
      sheet.appendRow([id, title, year, new Date().toISOString()]);
      
      return createJsonResponse({ status: 'success', message: 'Movie saved successfully' });
    }
    
    return createJsonResponse({ status: 'error', message: 'Invalid action' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
