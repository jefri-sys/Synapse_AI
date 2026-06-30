const fs = require('fs');
const file = 'd:/Synapse/frontend/src/components/mobile/pages/MobileMessages.jsx';
let content = fs.readFileSync(file, 'utf8');

const regexCall = /const currentUserId = user\?\._id \|\| user\?\.id;\s*const otherUser = activeConversation\.participants\?\.find\(p => String\(p\._id \|\| p\) !== String\(currentUserId\)\);\s*if \(!otherUser\) return;/;

const replaceCall = `const currentUserId = user?._id || user?.id;
    const currentConv = localConversations.find(c => String(c._id) === String(activeConversation._id)) || activeConversation;
    const otherUser = currentConv.participants?.find(p => String(p._id || p) !== String(currentUserId));
    if (!otherUser) return;`;

content = content.replace(regexCall, replaceCall);

fs.writeFileSync(file, content);
console.log('Update complete!');
