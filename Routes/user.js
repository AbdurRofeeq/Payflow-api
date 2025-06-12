const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, deleteUser } = require('../Controllers/UserController');
const auth = require('../Middleware/Auth');
const authorizeRole = require('../Middleware/AuthorizeRole');

router.get('/users', auth, authorizeRole('Admin'), getAllUsers);
router.get('/users/:id', auth, authorizeRole('Admin'), getUserById);
router.delete('/users/:id', auth, authorizeRole('Admin'), deleteUser);

module.exports = router;


