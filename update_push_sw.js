const fs = require('fs');
const file = 'd:/Synapse/frontend/public/push-sw.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /clients\.matchAll\(\{ type: 'window', includeUncontrolled: true \}\)\.then\(\(clientList\) => \{\s*for \(const client of clientList\) \{\s*if \(client\.focused\) return;\s*\}\s*return self\.registration\.showNotification\(payload\.title, \{\s*body: payload\.body,\s*icon: '\/pwa-192x192\.png',\s*badge: '\/pwa-192x192\.png',\s*data: \{ url: payload\.url \}\s*\}\);\s*\}\)/;

const replace = `self.registration.showNotification(payload.title, {
          body: payload.body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          data: { url: payload.url }
        })`;

content = content.replace(regex, replace);

fs.writeFileSync(file, content);
console.log('Update complete!');
