const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/github', authController.githubAuth);
router.get('/github/callback', authController.githubCallback);
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/send-code', authController.sendVerificationCode);
router.post('/verify-code', authController.verifyCode);
router.post('/login-with-code', authController.loginWithCode);

module.exports = router;