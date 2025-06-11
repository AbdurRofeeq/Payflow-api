const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, deleteUser } = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');

router.get('/users', auth, authorizeRole('Admin'), getAllUsers);
router.get('/users/:id', auth, authorizeRole('Admin'), getUserById);
router.delete('/users/:id', auth, authorizeRole('Admin'), deleteUser);

module.exports = router;


