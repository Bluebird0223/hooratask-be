const express = require('express');
const expensesRoutes = require('./expenses.routes');
const userRouter = require('./users.routes');
const { getBalances, getOptimizedSettlements } = require('../controllers/expensesController');

const router = express.Router();

router.use('/users', userRouter);
router.use('/expenses', expensesRoutes);
router.get('/balances', getBalances);
router.get('/settlements', getOptimizedSettlements);

module.exports = router;
