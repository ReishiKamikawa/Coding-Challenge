const express = require('express');
const router = express.Router({ mergeParams: true });
const taskController = require('../controllers/taskController');
const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token.' });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

router.get('/', authenticateJWT, taskController.getTasks);
router.post('/', authenticateJWT, taskController.createTask);
router.get('/:taskId', authenticateJWT, taskController.getTaskById);
router.put('/:taskId', authenticateJWT, taskController.updateTask);
router.delete('/:taskId', authenticateJWT, taskController.deleteTask);
router.post('/:taskId/assign', authenticateJWT, taskController.assignMember);
router.get('/:taskId/assign', authenticateJWT, taskController.getAssignedMembers);
router.delete('/:taskId/assign/:memberId', authenticateJWT, taskController.removeAssignment);
router.post('/:taskId/github-attach', authenticateJWT, taskController.attachGithub);
router.get('/:taskId/github-attachments', authenticateJWT, taskController.getGithubAttachments);
router.delete('/:taskId/github-attachments/:attachmentId', authenticateJWT, taskController.removeGithubAttachment);

module.exports = router;

