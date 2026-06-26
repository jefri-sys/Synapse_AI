const { routeRequest } = require('./aiRouter');

async function simulateHiringManagerReview(resume, jobDescription) {
  let rawResponse = '';
  try {
    const resumeText = JSON.stringify(resume.content || {}, null, 2);
    const jdText = jobDescription.rawText || '';

    const allKeywords = resume.recruiterAnalysis?.analysis?.missingKeywords || [];
    const realRequirements = [];
    const internalJargon = [];

    allKeywords.forEach(kw => {
      if (typeof kw === 'object' && kw !== null) {
        if (kw.category === 'role_specific_term') {
          internalJargon.push(kw);
        } else {
          realRequirements.push(kw);
        }
      } else {
        realRequirements.push(kw);
      }
    });

    const prompt = `Act as a hiring manager reviewing 200 applications for this role in one sitting. You have about 7 seconds of real attention per resume before deciding yes/maybe/no.

Job Description:
${jdText}

Real technical requirements this candidate is missing: 
${JSON.stringify(realRequirements)}

Note: this posting also uses some unusual internal terminology (${JSON.stringify(internalJargon)}) — do not treat these as meaningful evaluation criteria, do not factor them into the verdict or reasoning, they are noted for awareness only.

Candidate's Resume:
${resumeText}

Based on a rapid, 7-second skim:
1. "attentionSections": array of objects { "section": string, "impact": "positive" | "negative", "reason": string } — sections that immediately stand out.
2. "skippedSections": array of objects { "section": string, "reason": string } — sections likely to be ignored or skimmed past due to length, formatting, or irrelevance.
3. "verdict": exactly one of "shortlist", "consideration", "rejection".
4. "verdictReasoning": a short paragraph explaining the verdict based on relevance, clarity, impact, and differentiation.

Return ONLY a JSON object exactly matching this shape, with no markdown formatting and no preamble:
{
  "attentionSections": [{ "section": "string", "impact": "positive", "reason": "string" }],
  "skippedSections": [{ "section": "string", "reason": "string" }],
  "verdict": "shortlist",
  "verdictReasoning": "string"
}`;

    rawResponse = await routeRequest("hiring-manager-simulation", { prompt, files: [] });

    // formatGuard-style safe JSON parser
    let jsonStr = rawResponse;
    let jsonStart = jsonStr.indexOf('{');
    let jsonEnd = jsonStr.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }

    const simulation = JSON.parse(jsonStr);

    return { success: true, simulation, rawResponse };
  } catch (error) {
    console.error('Hiring Manager Simulation failed:', error);
    return { success: false, simulation: null, rawResponse: rawResponse || error.message };
  }
}

module.exports = {
  simulateHiringManagerReview
};
