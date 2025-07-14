const express = require('express');
const router = express.Router({ mergeParams: true });
const cardController = require('../controllers/cardController');
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

router.get('/', authenticateJWT, cardController.getCards);
router.post('/', authenticateJWT, cardController.createCard);
router.get('/:id', authenticateJWT, cardController.getCardById);
router.get('/user/:user_id', authenticateJWT, cardController.getCardsByUser);
router.put('/:id', authenticateJWT, cardController.updateCard);
router.delete('/:id', authenticateJWT, cardController.deleteCard);
router.post('/invite', authenticateJWT, cardController.inviteMember);
router.post('/:id/invite/accept', authenticateJWT, cardController.acceptInvite);

module.exports = router;

