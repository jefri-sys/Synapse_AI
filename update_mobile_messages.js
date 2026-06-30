const fs = require('fs');
const file = 'd:/Synapse/frontend/src/components/mobile/pages/MobileMessages.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /setLocalConversations\(prev => \{\s*if \(prev\.length === 0\) return conversations;\s*return conversations\.map\(c => \{\s*const prevC = prev\.find\(p => String\(p\._id\) === String\(c\._id\)\);\s*if \(prevC && prevC\.lastMessage && new Date\(prevC\.updatedAt \|\| 0\) > new Date\(c\.updatedAt \|\| 0\)\) \{\s*return prevC;\s*\}\s*return c;\s*\}\);\s*\}\);/;

const replace1 = `setLocalConversations(prev => {
      if (prev.length === 0) return conversations;
      return conversations.map(c => {
         const prevC = prev.find(p => String(p._id) === String(c._id));
         let result = c;
         if (prevC && prevC.lastMessage && new Date(prevC.updatedAt || 0) > new Date(c.updatedAt || 0)) {
             result = prevC;
         }
         if (prevC && result.participants) {
             result = {
                 ...result,
                 participants: result.participants.map(rp => {
                     const prevP = prevC.participants?.find(pp => String(pp._id || pp) === String(rp._id || rp));
                     return prevP?.status ? { ...rp, status: prevP.status } : rp;
                 })
             };
         }
         return result;
      });
    });`;

content = content.replace(regex1, replace1);

const regex2 = /if \(viewMode === 'chat' && activeConversation\) \{\s*const isGroup = activeConversation\.type === 'group';\s*const otherUser = activeConversation\.participants\?\.find\(p => String\(p\._id \|\| p\) !== String\(currentUserId\)\);\s*const name = isGroup \? activeConversation\.groupName : \(otherUser\?\.name \|\| 'Unknown'\);\s*const avatar = isGroup \? \(activeConversation\.groupAvatar \|\| `https:\/\/ui-avatars\.com\/api\/\?name=\$\{name\}`\) : \(otherUser\?\.avatar \|\| `https:\/\/ui-avatars\.com\/api\/\?name=\$\{name\}`\);\s*const isOnline = !isGroup && otherUser\?\.status === 'online';/m;

const replace2 = `if (viewMode === 'chat' && activeConversation) {
    const currentConv = localConversations.find(c => String(c._id) === String(activeConversation._id)) || activeConversation;
    const isGroup = currentConv.type === 'group';
    const otherUser = currentConv.participants?.find(p => String(p._id || p) !== String(currentUserId));
    const name = isGroup ? currentConv.groupName : (otherUser?.name || 'Unknown');
    const avatar = isGroup ? (currentConv.groupAvatar || \`https://ui-avatars.com/api/?name=\${name}\`) : (otherUser?.avatar || \`https://ui-avatars.com/api/?name=\${name}\`);
    const isOnline = !isGroup && otherUser?.status === 'online';`;

content = content.replace(regex2, replace2);

fs.writeFileSync(file, content);
console.log('Update complete!');
