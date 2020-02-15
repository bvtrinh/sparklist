const router = require('express').Router();
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Model
const User = require('../models/User');

module.exports = router;
