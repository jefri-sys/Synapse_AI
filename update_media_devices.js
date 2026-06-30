const fs = require('fs');
const file = 'd:/Synapse/frontend/src/components/mobile/pages/MobileMessages.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /try \{\s*const stream = await navigator\.mediaDevices\.getUserMedia\(\{ audio: true, video: type === 'video' \}\);/m;

const replace = `try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your device or browser doesn't support calls, or it requires a secure HTTPS connection.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });`;

content = content.replace(regex, replace);

fs.writeFileSync(file, content);
console.log('Update complete!');
