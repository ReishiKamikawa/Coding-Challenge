const axios = require('axios');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { db } = require('../firebase');
const { collection, doc, setDoc, getDoc, query, where, getDocs, runTransaction } = require('firebase/firestore');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


const verificationCodes = {};

exports.githubAuth = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.LOCAL_TUNNEL_URL + '/auth/github/callback';
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`);
};

exports.githubCallback = async (req, res) => {
  const code = req.query.code;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const frontendRedirectUrl = process.env.LOCAL_TUNNEL_URL + '/dashboard';

  try {

    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      { client_id: clientId, client_secret: clientSecret, code },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = response.data.access_token;


    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`
      }
    });

    const githubUser = userResponse.data;


    const result = await runTransaction(db, async (transaction) => {

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('githubId', '==', githubUser.id.toString()));
      const querySnapshot = await getDocs(q);

      let userId;

      if (querySnapshot.empty) {

        const newUserRef = doc(usersRef);
        userId = newUserRef.id;

        transaction.set(newUserRef, {
          id: userId,
          githubId: githubUser.id.toString(),
          email: githubUser.email,
          name: githubUser.name,
          avatar: githubUser.avatar_url,
          createdAt: new Date().toISOString()
        });
      } else {

        const userDoc = querySnapshot.docs[0];
        userId = userDoc.id;


        transaction.update(userDoc.ref, {
          name: githubUser.name,
          avatar: githubUser.avatar_url,
          lastLoginAt: new Date().toISOString()
        });
      }

      return { userId };
    });


    const token = jwt.sign({
      id: result.userId,
      githubId: githubUser.id.toString()
    }, process.env.JWT_SECRET, { expiresIn: '7d' });


    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });


    res.redirect(frontendRedirectUrl);
  } catch (error) {
    console.error('GitHub authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

exports.signup = async (req, res) => {
  const { email, password, verificationCode } = req.body;
  if (!email || !password || !verificationCode) {
    return res.status(400).json({ error: 'Email, password, and verification code are required.' });
  }

  if (verificationCodes[email] !== verificationCode) {
    return res.status(401).json({ error: 'Invalid verification code.' });
  }

  try {
    const result = await runTransaction(db, async (transaction) => {

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error('User already exists');
      }


      const newUserRef = doc(usersRef);
      const userId = newUserRef.id;
      transaction.set(newUserRef, { id: userId, email, password });

      return { id: userId, email };
    });

    delete verificationCodes[email];
    res.status(201).json(result);
  } catch (error) {
    console.error('Error during signup:', error);
    if (error.message === 'User already exists') {
      return res.status(409).json({ error: 'User already exists.' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = {
    code: code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
  };


  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${code}`
    });
    console.log(`Verification code ${code} sent to email: ${email}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data();
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Error during signin:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
};


exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const storedCode = verificationCodes[email];

    if (!storedCode || typeof storedCode === 'string') {

      if (typeof storedCode === 'string' && storedCode === code) {

        delete verificationCodes[email];
        return res.status(200).json({ message: 'Email verified successfully' });
      }
      return res.status(400).json({ message: 'No verification code found for this email or code is invalid' });
    }

    if (storedCode.expiresAt && new Date() > new Date(storedCode.expiresAt)) {

      delete verificationCodes[email];
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    if (storedCode.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }


    delete verificationCodes[email];

    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying code:', error);
    return res.status(500).json({ message: 'Failed to verify code' });
  }
};


exports.loginWithCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const storedCode = verificationCodes[email];

    if (!storedCode) {
      return res.status(400).json({ message: 'No verification code found for this email' });
    }

    if (new Date() > new Date(storedCode.expiresAt)) {

      delete verificationCodes[email];
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    if (storedCode.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }


    delete verificationCodes[email];

    try {

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      let userId;

      if (querySnapshot.empty) {

        const newUserRef = doc(usersRef);
        userId = newUserRef.id;

        await setDoc(newUserRef, {
          id: userId,
          email,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        });
      } else {

        const userDoc = querySnapshot.docs[0];
        userId = userDoc.id;


        await setDoc(userDoc.ref, {
          ...userDoc.data(),
          emailVerified: true,
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
      }


      const token = jwt.sign({
        id: userId,
        email,
        emailVerified: true
      }, process.env.JWT_SECRET, { expiresIn: '7d' });


      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: userId,
          email,
          emailVerified: true
        }
      });

    } catch (dbError) {
      console.error('Database error during login with code:', dbError);
      return res.status(500).json({ message: 'Internal server error during login' });
    }

  } catch (error) {
    console.error('Error during login with code:', error);
    return res.status(500).json({ message: 'Failed to login' });
  }
};
