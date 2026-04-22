const express = require('express');
const { getUsers, getUserById, updateUser, deleteUser, createUser } = require('../controllers/userController');

const userRouter = express.Router();

userRouter.post('/', createUser);
userRouter.get('/', getUsers);
userRouter.get('/:id', getUserById);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', deleteUser);

module.exports = userRouter;
