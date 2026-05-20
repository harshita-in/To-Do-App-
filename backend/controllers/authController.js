const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const TaskList = require('../models/TaskList');
const Tasks = require('../models/Task');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey123', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { user_name, user_email, user_password } = req.body;

    if (!user_name || !user_email || !user_password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Custom email format validation (must contain '@' and a dot in domain)
    if (!user_email.includes('@') || !user_email.split('@')[1]?.includes('.')) {
      return res.status(400).json({ message: 'Email must contain "@" and a domain suffix (e.g. .com)' });
    }

    // Check if user already exists (by email or username)
    const emailExists = await User.findOne({ user_email: user_email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const usernameExists = await User.findOne({ user_name: user_name.trim() });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user_password, salt);

    // Create user (auto-increment user_id trigger in pre-save hook)
    const user = await User.create({
      user_name: user_name.trim(),
      user_email: user_email.toLowerCase().trim(),
      user_password: hashedPassword
    });

    if (user) {
      // Automatically create the default "tasks" list (list_number 1)
      await TaskList.create({
        user_id: user._id,
        list_number: 1,
        list_name: 'tasks'
      });

      // Initialize the tasks document for the default list
      await Tasks.create({
        user_id: user._id,
        list_number: 1,
        task_number: [],
        task_name: [],
        time: [],
        completed: []
      });

      res.status(201).json({
        user_id: user._id,
        user_name: user.user_name,
        user_email: user.user_email,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { identifier, user_password } = req.body; // identifier can be email or username

    if (!identifier || !user_password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Search user by email or username
    const user = await User.findOne({
      $or: [
        { user_email: identifier.toLowerCase().trim() },
        { user_name: identifier.trim() }
      ]
    });

    if (user && (await bcrypt.compare(user_password, user.user_password))) {
      res.json({
        user_id: user._id,
        user_name: user.user_name,
        user_email: user.user_email,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-user_password');
    if (user) {
      res.json({
        user_id: user._id,
        user_name: user.user_name,
        user_email: user.user_email
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  signup,
  login,
  getProfile
};
