const { routeRequest } = require('./aiRouter');

function compareKeywordsToResume(jobDescription, resume) {
  const extractedKeywords = jobDescription.extractedKeywords || [];
  if (!extractedKeywords.length) return [];

  // Build a single lowercase text blob from the resume content
  let textBlob = '';
  const c = resume.content || {};

  if (c.skills && Array.isArray(c.skills)) {
    textBlob += c.skills.join(' ');
  } else if (c.skills && typeof c.skills === 'string') {
    textBlob += ' ' + c.skills;
  }
  
  const collectFromArr = (arr, fields) => {
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        if (!item || typeof item !== 'object') return;
        fields.forEach(f => {
          if (item[f] && typeof item[f] === 'string') textBlob += ' ' + item[f];
          if (item[f] && Array.isArray(item[f])) textBlob += ' ' + item[f].join(' ');
        });
      });
    } else if (typeof arr === 'string') {
      textBlob += ' ' + arr;
    }
  };

  collectFromArr(c.experience, ['company', 'role', 'description']);
  collectFromArr(c.projects, ['title', 'description', 'technologies']);
  collectFromArr(c.internships, ['company', 'role', 'description']);
  collectFromArr(c.education, ['institution', 'degree', 'field', 'relevantCoursework']);
  collectFromArr(c.certifications, ['title', 'issuer']);
  collectFromArr(c.achievements, ['title', 'description']);
  collectFromArr(c.research, ['title', 'publication', 'description']);

  textBlob = textBlob.toLowerCase();

  const missing = [];
  for (const kw of extractedKeywords) {
    if (!textBlob.includes(kw.toLowerCase())) {
      missing.push(kw);
    }
  }

  return missing;
}

async function generateRecruiterAnalysis(resume, jobDescription) {
  let rawResponse = '';
  try {
    console.log("DEBUG [generateRecruiterAnalysis]: resume.content is:", JSON.stringify(resume.content, null, 2));
    const resumeText = JSON.stringify(resume.content || {}, null, 2);
    const jdText = jobDescription.rawText || '';

    // Step 1: Deterministic keyword extraction mismatch
    const missingKeywords = compareKeywordsToResume(jobDescription, resume);

    const targetRoleText = resume.targetRole ? resume.targetRole : "a general position";

    const prompt = `Act as a senior recruiter reviewing this resume for the role of ${targetRoleText}. Be brutally honest — the student needs to fix real problems now, not receive generic encouragement.

The following missing keywords have been identified deterministically from the job description: ${JSON.stringify(missingKeywords)}. For each one, classify it into exactly one category:
    - 'core_skill': a concrete, learnable technical skill, tool, language, or platform (e.g. 'Python', 'Salesforce', 'Docker')
    - 'role_specific_term': internal company/role terminology that may sound unusual out of context but is explicitly used in this specific job posting (e.g. unusual phrases that are clearly this company's internal jargon)
    - 'soft_requirement': process/methodology terms (e.g. 'Agile', 'DevOps')
  For each keyword, also assign a priority: 'critical' (explicitly required, mentioned prominently/repeatedly in the JD) or 'nice_to_have' (mentioned once, peripherally, or in a generic list).
  Do not change, add, or remove any keyword from the provided list — only classify and prioritize each one exactly as given.

Here is the candidate's Resume:
${resumeText}

Here is the exact Job Description:
${jdText}

Return ONLY valid JSON matching this exact shape, with no markdown, no preamble:
{
  "matchScore": 0, // Number between 0 and 100
  "missingKeywords": [
    { "term": "string", "category": "core_skill | role_specific_term | soft_requirement", "priority": "critical | nice_to_have" }
  ],
  "redFlags": ["string"], // up to 3 concrete issues a hiring manager would notice in under 10s
  "strongSections": [
    { "section": "string", "reason": "string" }
  ],
  "weakSections": [
    { "section": "string", "reason": "string" }
  ],
  "comparisonToStrongCandidate": "string" // 3-5 sentences comparing this resume to a typical strong candidate for this role
}`;

    rawResponse = await routeRequest("recruiter-analysis", { prompt, files: [], responseMimeType: "application/json" });

    // formatGuard-style safe JSON parser
    let jsonStr = rawResponse;
    let jsonStart = jsonStr.indexOf('{');
    let jsonEnd = jsonStr.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonStr);
      // Basic validation
      if (!analysis.matchScore && analysis.matchScore !== 0) analysis.matchScore = 0;
      if (!Array.isArray(analysis.missingKeywords)) analysis.missingKeywords = [];
      if (!Array.isArray(analysis.redFlags)) analysis.redFlags = [];
      if (!Array.isArray(analysis.strongSections)) analysis.strongSections = [];
      if (!Array.isArray(analysis.weakSections)) analysis.weakSections = [];
      if (!analysis.comparisonToStrongCandidate) analysis.comparisonToStrongCandidate = "Comparison unavailable.";
    } catch (parseError) {
      console.warn("Failed to parse Recruiter Analysis JSON. Raw response:", rawResponse);
      analysis = {
        matchScore: 0,
        missingKeywords: [],
        redFlags: ["Our AI service encountered a temporary processing error. Please try running the analysis again."],
        strongSections: [],
        weakSections: [],
        comparisonToStrongCandidate: "We hit a temporary issue generating this analysis. This is not a reflection of your resume's quality — please click Run Analysis again."
      };
    }

    return { success: true, analysis, rawResponse };
  } catch (error) {
    console.error('Recruiter analysis failed:', error.message, error.stack);
    // Return a graceful fallback instead of failing to prevent frontend 500 crashes
    const fallbackAnalysis = {
        matchScore: 0,
        missingKeywords: [],
        redFlags: ["Analysis service is currently unavailable or failed to process this document."],
        strongSections: [],
        weakSections: [],
        comparisonToStrongCandidate: "Service error: " + error.message
    };
    return { success: true, analysis: fallbackAnalysis, rawResponse: error.message };
  }
}

module.exports = {
  generateRecruiterAnalysis,
  compareKeywordsToResume
};
