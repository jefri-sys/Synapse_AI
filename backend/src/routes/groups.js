const express = require('express');
const router = express.Router();
const groupsController = require('../controllers/groupsController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', groupsController.createGroup);
router.get('/discover', groupsController.discoverGroups);
router.get('/mine', groupsController.getMyGroups);
router.post('/:id/join', groupsController.joinGroup);
router.post('/:id/leave', groupsController.leaveGroup);
router.delete('/:id', groupsController.deleteGroup);
router.get('/:id/messages', groupsController.getGroupMessages);
router.post('/:id/read', groupsController.markAsRead);
const { upload } = require('../middleware/mediaUpload');

router.post('/:id/share-summary', groupsController.shareSummary);
router.post('/:id/messages/media', upload.single('file'), groupsController.createMediaMessage);
router.delete('/:id/messages/:messageId', groupsController.deleteMessage);
router.post('/:id/messages/:messageId/react', groupsController.reactToMessage);

router.put('/:id/role/:userId', groupsController.updateRole);
router.patch('/:id/permissions', groupsController.updatePermissions);
router.delete('/:id/members/:userId', groupsController.kickMember);
router.post('/:id/members', groupsController.addMember);
router.patch('/:id/members/:userId/mute', groupsController.muteMember);
router.patch('/:id/info', groupsController.updateGroupInfo);

router.post('/:id/ai/exam-plan', groupsController.aiExamPlan);
router.post('/:id/ai/ask', groupsController.aiAsk);
router.post('/:id/ai/evaluate', groupsController.aiEvaluate);

module.exports = router;
