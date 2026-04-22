const express = require('express');
const { createExpense, getAllExpenses, getOptimizedSettlements, getBalances, deleteExpense } = require('../controllers/expensesController');

const expensesRoutes = express.Router();

expensesRoutes.post('/', createExpense);
expensesRoutes.get('/', getAllExpenses);
expensesRoutes.delete('/:id', deleteExpense);

module.exports = expensesRoutes;
