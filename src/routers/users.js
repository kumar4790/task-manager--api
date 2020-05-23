const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const router = new express.Router();
const Users = require('../models/users');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account');

//Create users to the db
router.post('/users', async (req, res) => {
  const user = new Users(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateWebToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

//add the profile picture
const upload = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image!'));
    }
    cb(undefined, true);
  },
});

router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    try {
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 })
        .png()
        .toBuffer();
      req.user.avatar = buffer;
      await req.user.save();
      res.send();
    } catch (e) {
      res.status(400).send(e);
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

//delete the avatar

router.delete(
  '/users/me/avatar',
  auth,
  async (req, res) => {
    try {
      req.user.avatar = undefined;
      await req.user.save();
      res.send();
    } catch (e) {
      res.status(500).send(e);
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

//get the users profile picture

router.get('/users/:id/avatar', async (req, res) => {
  const user = await Users.findById(req.params.id);
  try {
    if (!user || !user.avatar) {
      throw new Error('image not found');
    }
    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (e) {
    res.status(500).send(e);
  }
});

//Get the users to the db using email and password for login
router.post('/users/login', async (req, res) => {
  try {
    const user = await Users.findUserByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateWebToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

//logout the user from perticular system like desktop or mobile
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    req.user.save();
    res.send({ message: 'Logout Successful!' });
  } catch (e) {
    res.status(500).send();
  }
});

//logout from all the systems
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    req.user.save();
    res.send({ message: 'All accounts logout Successfully!' });
  } catch (e) {
    res.status(500).send();
  }
});

//Read the list of users from db
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

//read the user by its email from db
router.get('/users/:email', auth, async (req, res) => {
  const email = req.params.email;
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).send();
    }
    res.send({ _id, name, email });
  } catch (e) {
    res.status(500).send();
  }
});

//Read the list of users from db
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

//Update the user data from db

router.patch('/users/me', auth, async (req, res) => {
  const requestedUpdates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'age', 'password'];
  const isAllowedUpdate = requestedUpdates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isAllowedUpdate) {
    return res.status(400).send('error: Invalid Updates!');
  }

  try {
    requestedUpdates.forEach((update) => {
      req.user[update] = req.body[update];
    });
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
    res.status(500).send();
  }
});

//Delete the User from the db
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    sendCancelEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
