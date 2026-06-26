const { routeRequest } = require('./aiRouter');
const CareerDocument = require('../models/CareerDocument');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const User = require('../models/User');

async function generateResumeContent(userId, targetRole) {
  let rawResponse = '';
  try {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    const careerDocs = await CareerDocument.find({ userId }).lean();
    const semesters = await Semester.find({ userId }).lean();
    const subjects = await Subject.find({ userId }).lean();

    const academicData = {
      semesters: semesters.map(s => ({
        semesterNumber: s.semesterNumber,
        academicYear: s.academicYear,
        startDate: s.startDate,
        endDate: s.endDate,
        isCompleted: s.isCompleted
      })),
      subjects: subjects.map(s => ({
        name: s.name,
        code: s.code,
        credits: s.credits,
        type: s.type,
        semester: s.semester
      })),
      college: user.college,
      course: user.course,
      targetCGPA: user.targetCGPA
    };

    const vaultData = careerDocs.map(doc => ({
      _id: doc._id,
      category: doc.category,
      title: doc.title,
      issuer: doc.issuer,
      dateEarned: doc.dateEarned,
      skillsTags: doc.skillsTags,
      extractedFields: doc.extractedFields
    }));

    const sourceSnapshot = {
      careerDocumentIds: careerDocs.map(d => d._id),
      semestersIds: semesters.map(s => s._id),
      subjectsIds: subjects.map(s => s._id)
    };

    const prompt = `You are an expert resume writer. The user's basic info is:
Name: ${user.name}
Email: ${user.email}
College: ${user.college}
Course: ${user.course}

Here is their Academic Tracker data:
${JSON.stringify(academicData, null, 2)}

Here is their Career Vault data (certifications, internships, projects, etc.):
${JSON.stringify(vaultData, null, 2)}

Your task is to generate the content for a resume tailored to the target role: "${targetRole}".
Please select and prioritize the most relevant entries for this specific role from the provided data.
For example, if the role is software_development, prioritize coding projects and technical certifications.
If personalInfo isn't available from Vault/Academic data (e.g. phone, linkedin, github, portfolio), leave those fields as empty strings.

Return ONLY structured JSON content. Do NOT include any HTML, styling, formatting instructions, or layout information. Your only job is selecting and organizing content into the schema below.

Required JSON shape:
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
}`;

    // Note: AI dispatcher handles mapping this request to a standard context format. No files this time.
    rawResponse = await routeRequest("resume-generation", { prompt, files: [], responseMimeType: "application/json" });

    // formatGuard-style safe JSON parser: strip markdown by extracting substring between first { and last }
    let jsonStr = rawResponse;
    let jsonStart = jsonStr.indexOf('{');
    let jsonEnd = jsonStr.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      // Clean up trailing commas which cause "Expected double-quoted property name" errors
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    }

    const content = JSON.parse(jsonStr);

    return { success: true, content, sourceSnapshot, rawResponse };
  } catch (error) {
    console.error('Resume generation failed:', error);
    return { success: false, content: null, rawResponse: rawResponse || error.message, sourceSnapshot: null };
  }
}

module.exports = {
  generateResumeContent
};
