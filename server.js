/* jshint esversion: 5 */
/* jshint node: true */

var express = require('express');
var mongoose = require('mongoose');
var cors = require('cors');
var path = require('path');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var multer = require('multer');
require('dotenv').config();

var app = express();
var PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/userloginapp');

// User Schema
var userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: { type: String, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  firstName: String,
  lastName: String,
  birthday: Date,
  biography: String,
  favoriteNumber: Number,
  profilePicture: String
});

// Password hashing
userSchema.pre('save', function(next) {
  var user = this;
  if (user.isModified('password')) {
    bcrypt.hash(user.password, 10, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  } else {
    next();
  }
});

var User = mongoose.model('User', userSchema);

// Auth middleware
function auth(req, res, next) {
  var token = req.header('Authorization');
  if (token) {
    token = token.replace('Bearer ', '');
  }
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'secret-key', function(err, decoded) {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    User.findById(decoded.userId, function(err, user) {
      if (err || !user) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.user = user;
      next();
    });
  });
}

// File upload setup with JPG validation
var upload = multer({
  dest: 'uploads/',
  fileFilter: function(req, file, cb) {
    if (file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG images are allowed'));
    }
  }
});

// Routes
app.post('/api/auth/register', function(req, res) {
  var user = new User(req.body);
  user.save(function(err) {
    if (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      return res.status(400).json({ error: 'Invalid data format' });
    }
    var token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret-key');
    res.json({ user: user, token: token });
  });
});

app.post('/api/auth/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  
  User.findOne({ username: username }, function(err, user) {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    bcrypt.compare(password, user.password, function(err, isMatch) {
      if (err || !isMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      var token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret-key');
      res.json({ user: user, token: token });
    });
  });
});

app.get('/api/profile', auth, function(req, res) {
  res.json(req.user);
});

app.patch('/api/profile', auth, function(req, res) {
  Object.keys(req.body).forEach(function(key) {
    req.user[key] = req.body[key];
  });
  
  req.user.save(function(err) {
    if (err) {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    res.json(req.user);
  });
});

app.post('/api/profile/picture', auth, upload.single('profilePicture'), function(req, res) {
  if (req.file) {
    req.user.profilePicture = '/uploads/' + req.file.filename;
    req.user.save(function(err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to save profile picture' });
      }
      res.json({ profilePicture: req.user.profilePicture });
    });
  } else {
    res.status(400).json({ error: 'No file uploaded or invalid file type' });
  }
});

// Start server
app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
}); 