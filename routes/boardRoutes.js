const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
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

router.post('/', authenticateJWT, boardController.createBoard);
router.get('/', authenticateJWT, boardController.getBoards);
router.get('/:id', authenticateJWT, boardController.getBoardById);
router.put('/:id', authenticateJWT, boardController.updateBoard);
router.delete('/:id', authenticateJWT, boardController.deleteBoard);

module.exports = router;
