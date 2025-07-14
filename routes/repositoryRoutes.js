const express = require('express');
const router = express.Router();
const repositoryController = require('../controllers/repositoryController');
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

router.get('/:repositoryId/github-info', authenticateJWT, repositoryController.getGithubInfo);

module.exports = router;

