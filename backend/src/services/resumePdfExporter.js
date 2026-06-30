const puppeteer = require('puppeteer');
const cloudinary = require('../config/cloudinary');
const { getTemplate } = require('./resumeTemplates');

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "synapse/resumes",
        resource_type: "raw",
        format: "pdf"
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          pdfUrl: result.secure_url,
          cloudinaryPublicId: result.public_id
        });
      }
    );
    uploadStream.end(buffer);
  });
};

async function generateResumePdf(resume) {
  const renderFunc = getTemplate(resume.templateId);
  const html = renderFunc(resume);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.platform === 'win32' 
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
      : undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.6in',
        right: '0.6in'
      }
    });

    const uploadResult = await uploadToCloudinary(pdfBuffer);
    
    return uploadResult;
  } finally {
    await browser.close();
  }
}

module.exports = { generateResumePdf };
