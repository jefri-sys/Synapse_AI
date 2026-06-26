const { routeRequest } = require('./aiRouter');

async function generateRewriteSuggestions(resume, jobDescription, recruiterAnalysis) {
  let rawResponse = '';
  try {
    const jdText = jobDescription.rawText || '';
    const allKeywords = recruiterAnalysis.missingKeywords || [];
    
    // Filter out company-specific jargon so it doesn't get awkwardly inserted into rewrites
    const actionableKeywords = allKeywords.filter(kw => {
      if (typeof kw === 'object' && kw !== null) {
        return kw.category !== 'role_specific_term';
      }
      return true;
    });
    
    // Only pass the relevant sections for rewriting
    const targetSections = {
      experience: resume.content?.experience || [],
      projects: resume.content?.projects || [],
      internships: resume.content?.internships || []
    };

    const prompt = `You are an expert resume writer. The student needs to rewrite the bullet points/descriptions in their Experience, Projects, and Internships sections to be more impactful.

Here are the target sections from their current resume:
${JSON.stringify(targetSections, null, 2)}

Here is the Job Description they are targeting:
${jdText}

Here are the missing technical and soft skills identified in their previous recruiter analysis (company-specific jargon has been intentionally excluded):
${JSON.stringify(actionableKeywords)}

Your task is to rewrite the "description" field for every entry in these sections based on these EXACT rules:
1. Naturally include the missing keywords where genuinely relevant — never forced. Do not invent or insert any company-specific jargon, internal terminology, or unusual phrases not provided in this filtered list — only use real, standard technical/professional terms.
2. Use the XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]" for every bullet/description.
3. Start every bullet with a strong action verb — never use weak phrases like "Responsible for" or "Helped with".
4. Add specific numbers wherever the original implies a measurable outcome; if no real number exists in the original text, insert a placeholder marked EXACTLY as "[FILL IN]" rather than inventing a fake number.
5. Keep each rewritten bullet to 1-2 lines maximum.
6. Order the entries within each section by apparent impact, most impressive first.

CRITICAL: You must return BOTH the original text and the rewritten text for every entry so they can be compared side-by-side. 
The "original" must be copied EXACTLY word-for-word from the original resume's "description" field.
The "entryIndex" must map to the exact array index of that item in the original section.

Return ONLY valid JSON matching this exact shape, with no markdown formatting and no preamble:
{
  "experience": [{ "entryIndex": 0, "original": "string", "rewritten": "string" }],
  "projects": [{ "entryIndex": 0, "original": "string", "rewritten": "string" }],
  "internships": [{ "entryIndex": 0, "original": "string", "rewritten": "string" }]
}`;

    rawResponse = await routeRequest("resume-rewrite", { prompt, files: [] });

    // formatGuard-style safe JSON parser
    let jsonStr = rawResponse;
    let jsonStart = jsonStr.indexOf('{');
    let jsonEnd = jsonStr.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }

    const suggestions = JSON.parse(jsonStr);

    return { success: true, suggestions, rawResponse };
  } catch (error) {
    console.error('Rewrite suggestions generation failed:', error);
    return { success: false, suggestions: null, rawResponse: rawResponse || error.message };
  }
}

module.exports = {
  generateRewriteSuggestions
};
