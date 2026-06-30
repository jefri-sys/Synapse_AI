const { routeRequest } = require('./aiRouter');

async function extractCareerDocFields(fileBuffer, mimetype, category) {
  let rawResponse = '';
  try {
    const base64 = fileBuffer.toString('base64');
    
const prompt = `Look at the attached document (image or PDF).
The document is a "${category}" type document.
CRITICAL: Return ONLY valid JSON. You MUST properly escape all double quotes (\") and newlines (\\n) inside string values. No markdown formatting, no preamble, in this exact shape:
{
  "title": "string",
  "issuer": "string or null",
  "dateEarned": "string in YYYY-MM-DD format or null",
  "skillsTags": ["array of strings (3-8 relevant skills/keywords, AI's own judgment, free-text)"]
}
If a field cannot be confidently determined from the document, return null for that field rather than guessing.`;

    const files = [{ data: base64, mimeType: mimetype }];
    
    let fields;
    
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        let currentPrompt = prompt;
        if (attempt === 2) {
           currentPrompt += `\n\nWARNING: Your previous response contained invalid JSON syntax (likely unescaped quotes or trailing commas). Please fix these issues and output strictly valid JSON.`;
        }
        
        rawResponse = await routeRequest("career-doc-extraction", { prompt: currentPrompt, files, responseMimeType: "application/json" });
        
        let jsonStr = rawResponse;
        let jsonStart = jsonStr.indexOf('{');
        let jsonEnd = jsonStr.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
          jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
        } else {
          throw new Error('No JSON boundaries found in response');
        }
        
        fields = JSON.parse(jsonStr);
        break; // Success
      } catch (parseError) {
        if (attempt === 2) {
          console.error('Career doc extraction JSON parse failed on retry:', parseError);
          return { success: false, fields: null, rawResponse: 'Failed to parse JSON: ' + parseError.message };
        }
      }
    }
    
    // If parsing succeeds but required "title" is missing/empty, treat as failure
    if (!fields || !fields.title || typeof fields.title !== 'string' || fields.title.trim() === '') {
      return { success: false, fields: fields || null, rawResponse };
    }
    
    return { success: true, fields, rawResponse };
  } catch (error) {
    console.error('Career doc extraction failed:', error);
    return { success: false, fields: null, rawResponse: rawResponse || error.message };
  }
}

module.exports = {
  extractCareerDocFields
};
