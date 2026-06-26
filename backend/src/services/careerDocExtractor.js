const { routeRequest } = require('./aiRouter');

async function extractCareerDocFields(fileBuffer, mimetype, category) {
  let rawResponse = '';
  try {
    const base64 = fileBuffer.toString('base64');
    
    const prompt = `Look at the attached document (image or PDF).
The document is a "${category}" type document.
Return ONLY valid JSON, no markdown formatting, no preamble, in this exact shape:
{
  "title": "string",
  "issuer": "string or null",
  "dateEarned": "string in YYYY-MM-DD format or null",
  "skillsTags": ["array of strings (3-8 relevant skills/keywords, AI's own judgment, free-text)"]
}
If a field cannot be confidently determined from the document, return null for that field rather than guessing.`;

    const files = [{ data: base64, mimeType: mimetype }];
    
    // Call Gemini via the existing routeRequest dispatcher pattern
    rawResponse = await routeRequest("career-doc-extraction", { prompt, files, responseMimeType: "application/json" });
    
    // formatGuard-style safe JSON parser: strip markdown by extracting substring between first { and last }
    let jsonStr = rawResponse;
    let jsonStart = jsonStr.indexOf('{');
    let jsonEnd = jsonStr.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      // Clean up trailing commas which cause "Expected double-quoted property name" errors
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    }
    
    const fields = JSON.parse(jsonStr);
    
    // If parsing succeeds but required "title" is missing/empty, treat as failure
    if (!fields || !fields.title || typeof fields.title !== 'string' || fields.title.trim() === '') {
      return { success: false, fields: fields || null, rawResponse };
    }
    
    return { success: true, fields, rawResponse };
  } catch (error) {
    console.error('Career doc extraction failed:', error);
    // Catch and return a structured failure object rather than throwing
    return { success: false, fields: null, rawResponse: rawResponse || error.message };
  }
}

module.exports = {
  extractCareerDocFields
};
