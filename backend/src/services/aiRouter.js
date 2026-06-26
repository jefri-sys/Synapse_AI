const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const User = require('../models/User');

async function routeRequest(feature, { prompt, systemPrompt, userMessage, maxTokens = 1024, userId, files = [], responseMimeType }, retries = 3) {
  const fullPromptText = systemPrompt
    ? `${systemPrompt}\n\n${userMessage || prompt}`
    : (prompt || userMessage)

  const parts = [];
  if (fullPromptText) parts.push({ text: fullPromptText });

  if (files && files.length > 0) {
    for (const f of files) {
      parts.push({
        inlineData: {
          data: f.data,
          mimeType: f.mimeType || 'application/pdf'
        }
      });
    }
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const requestPayload = { contents: [{ role: 'user', parts }] };
      if (responseMimeType) {
        requestPayload.generationConfig = { responseMimeType };
      }
      const result = await model.generateContent(requestPayload);
      const response = await result.response;
      
      if (userId && response.usageMetadata) {
        const totalTokens = response.usageMetadata.totalTokenCount;
        if (totalTokens) {
          try {
            await User.findByIdAndUpdate(userId, { $inc: { aiTokensUsed: totalTokens } }).exec();
          } catch (err) {
            console.error('[AI Router] Failed to update token usage:', err.message);
          }
        }
      }

      return response.text();
    } catch (err) {
      const isTransientError = err.status === 429 || (err.message && err.message.includes('503 Service Unavailable'));
      
      if (isTransientError && attempt < retries) {
        console.warn(`[AI Router] Transient error (${err.status || 503}) for feature ${feature}. Attempt ${attempt}/${retries}...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
        continue;
      }

      console.error(`[AI Router] Gemini error for feature ${feature}:`, err.message);
      if (err.status === 429) {
        throw new Error('The AI service is receiving too many requests right now. Please wait about 30 seconds and try again. (This is a temporary rate limit, not your account quota).');
      }
      if (err.message && err.message.includes('503 Service Unavailable')) {
        throw new Error('The AI model is currently experiencing high demand. Please try again in a few moments.');
      }
      if (err.message && err.message.includes('fetch failed')) {
        throw new Error('The AI engine experienced a temporary network disconnection or timeout while processing your syllabus. This happens if the syllabus is extremely large. Please try again, or select fewer files.');
      }

      // Fallback: If it's a generic Google Generative AI Error, extract a cleaner part or just show it.
      throw new Error(err.message || "AI service temporarily unavailable. Please try again.");
    }
  }
}

module.exports = { routeRequest }
