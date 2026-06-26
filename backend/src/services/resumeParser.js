const { routeRequest } = require('./aiRouter');
const { extractText } = require('./textExtractorService');

const RESUME_SCHEMA_PROMPT = `
Extract and map its content into EXACTLY this JSON shape:
{
  "personalInfo": { "name": "string", "email": "string", "phone": "string", "linkedin": "string", "github": "string", "portfolio": "string" },
  "education": [{ "institution": "string", "degree": "string", "field": "string", "startDate": "string", "endDate": "string", "cgpa": "string", "relevantCoursework": ["string"] }],
  "skills": ["string"],
  "projects": [{ "title": "string", "description": "string", "technologies": ["string"], "link": "string", "dateRange": "string" }],
  "certifications": [{ "title": "string", "issuer": "string", "date": "string" }],
  "internships": [{ "company": "string", "role": "string", "startDate": "string", "endDate": "string", "description": "string" }],
  "achievements": [{ "title": "string", "description": "string", "date": "string" }],
  "research": [{ "title": "string", "publication": "string", "date": "string", "description": "string" }],
  "experience": [{ "company": "string", "role": "string", "startDate": "string", "endDate": "string", "description": "string" }]
}

Map whatever section headings/structure the original resume uses onto this schema as sensibly as possible (e.g. a resume with "Work History" instead of "Experience" should still map into the experience array).
If a section doesn't exist in the original resume, return an empty array/object for it rather than omitting the key.
Return ONLY valid JSON, no markdown formatting, no preamble.`;

async function parseUploadedResume(fileBuffer, mimetype) {
  let rawResponse = '';
  console.log(`\n--- [parseUploadedResume] START ---`);
  console.log(`[parseUploadedResume] ENTRY: mimetype=${mimetype}, bufferSize=${fileBuffer ? fileBuffer.length : 'undefined'} bytes`);
  
  try {
    const isDocx = mimetype === 'application/msword' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    let prompt;
    let files = [];

    if (isDocx) {
      console.log(`[parseUploadedResume] PATH: DOCX text-extraction path taken`);
      // DOCX goes through text extraction -> Gemini Case A (text only)
      const extractResult = await extractText(fileBuffer, mimetype);
      if (!extractResult || !extractResult.text || extractResult.text.trim() === '') {
        console.error(`[parseUploadedResume] FAILURE: extractText returned empty or no text`);
        throw new Error('Could not extract text from this document');
      }
      
      prompt = `Read the following plain text extracted from a resume document.\n\nText:\n${extractResult.text}\n\n${RESUME_SCHEMA_PROMPT}`;
      // No files needed for Case A
    } else {
      console.log(`[parseUploadedResume] PATH: Vision path taken for PDF/image`);
      // PDF/Images go through Gemini Case B (vision)
      const base64 = fileBuffer.toString('base64');
      prompt = `Read the attached resume document (PDF or image).\n\n${RESUME_SCHEMA_PROMPT}`;
      files = [{ data: base64, mimeType: mimetype }];
    }
    
    console.log(`[parseUploadedResume] Calling routeRequest("resume-parsing")...`);
    rawResponse = await routeRequest("resume-parsing", { prompt, files, responseMimeType: "application/json" });
    
    console.log(`[parseUploadedResume] FULL rawResponse from Gemini:\n`, rawResponse);
    console.log(`--------------------------------------------------\n`);

    if (!rawResponse || rawResponse.trim() === '') {
      console.error(`[parseUploadedResume] FAILURE: rawResponse is completely empty`);
      return { success: false, content: null, rawResponse: 'Empty response from AI' };
    }

    // formatGuard-style safe JSON parser
    let jsonStr = rawResponse;
    let jsonStart = jsonStr.indexOf('{');
    let jsonEnd = jsonStr.lastIndexOf('}');
    
    console.log(`[parseUploadedResume] formatGuard: jsonStart=${jsonStart}, jsonEnd=${jsonEnd}`);

    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      // Clean up trailing commas which cause "Expected double-quoted property name" errors
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    } else {
      console.error(`[parseUploadedResume] FAILURE: No JSON boundaries found in rawResponse!`);
      return { success: false, content: null, rawResponse: 'No JSON boundaries found' };
    }
    
    let content;
    try {
      content = JSON.parse(jsonStr);
      console.log(`[parseUploadedResume] SUCCESS: Parsed JSON content:`, JSON.stringify(content, null, 2).substring(0, 400) + (JSON.stringify(content).length > 400 ? '...' : ''));
    } catch (parseError) {
      console.error(`[parseUploadedResume] FAILURE: JSON.parse threw error:`, parseError.message);
      return { success: false, content: null, rawResponse: 'Failed to parse JSON: ' + parseError.message };
    }
    
    console.log(`--- [parseUploadedResume] END ---\n`);
    return { success: true, content, rawResponse };
  } catch (error) {
    console.error(`[parseUploadedResume] FAILURE in CATCH block:`, error);
    return { success: false, content: null, rawResponse: rawResponse || error.message };
  }
}

module.exports = {
  parseUploadedResume
};
