const Expense = require('../models/Expenses.model');
const User = require('../models/User.model');
const BalanceCalculator = require('../utils/balanceCalculator');

const createExpense = async (req, res) => {
    try {
        const { description, totalAmount, payer, participants, splitType } = req.body;

        // Validation
        if (!description || !totalAmount || !payer || !participants || !splitType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (totalAmount <= 0) {
            return res.status(400).json({ error: 'Total amount must be greater than 0' });
        }

        // Check if payer exists in participants
        const payerInParticipants = participants.some(p => p.user === payer);
        if (!payerInParticipants) {
            return res.status(400).json({ error: 'Payer must be included in participants' });
        }

        // Calculate shares based on split type
        let calculatedParticipants = participants.map((participant) => ({
            user: participant.user,
            amount: Number(participant.amount) || 0,
            share: Number(participant.amount) || 0
        }));

        if (splitType === 'equal') {
            const equalShare = totalAmount / participants.length;
            calculatedParticipants = participants.map(p => ({
                user: p.user,
                amount: parseFloat(equalShare.toFixed(2)),
                share: parseFloat(equalShare.toFixed(2))
            }));

            // Adjust for rounding errors (add remainder to first participant)
            const totalCalculated = calculatedParticipants.reduce((sum, p) => sum + p.amount, 0);
            const difference = totalAmount - totalCalculated;
            if (Math.abs(difference) > 0.01) {
                calculatedParticipants[0].amount += difference;
            }
        } else {
            // Unequal split - validate total
            const totalParticipantAmount = calculatedParticipants.reduce((sum, p) => sum + p.amount, 0);
            if (Math.abs(totalParticipantAmount - totalAmount) > 0.01) {
                return res.status(400).json({
                    error: `Participant amounts sum (${totalParticipantAmount}) does not match total amount (${totalAmount})`
                });
            }
        }

        const expense = new Expense({
            description,
            totalAmount,
            payer,
            participants: calculatedParticipants,
            splitType
        });

        await expense.save();

        // Populate user details
        await expense.populate('payer', 'name email');
        await expense.populate('participants.user', 'name email');

        res.status(201).json({
            success: true,
            data: expense
        });

    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Get all expenses
const getAllExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find()
            .populate('payer', 'name email')
            .populate('participants.user', 'name email')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: expenses.length,
            data: expenses
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Delete expense
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        await expense.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Get balances
const getBalances = async (req, res) => {
    try {
        const expenses = await Expense.find();
        const users = await User.find();

        // Create user map
        const usersMap = new Map();
        users.forEach(user => {
            usersMap.set(user._id.toString(), user.name);
        });

        // Calculate net balances
        const netBalances = BalanceCalculator.calculateNetBalances(expenses);

        // Generate readable balance statements
        const balanceStatements = BalanceCalculator.generateBalanceStatements(netBalances, usersMap);

        res.status(200).json({
            success: true,
            data: balanceStatements
        });

    } catch (error) {
        console.error('Get balances error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Get optimized settlements
const getOptimizedSettlements = async (req, res) => {
    try {
        const expenses = await Expense.find();
        const users = await User.find();

        // Create user map
        const usersMap = new Map();
        users.forEach(user => {
            usersMap.set(user._id.toString(), user.name);
        });

        // Calculate net balances
        const netBalances = BalanceCalculator.calculateNetBalances(expenses);

        // Get optimized settlements
        const settlements = BalanceCalculator.optimizeSettlements(netBalances);

        // Format settlements with user names
        const formattedSettlements = settlements.map(settlement => ({
            from: usersMap.get(settlement.from) || settlement.from,
            to: usersMap.get(settlement.to) || settlement.to,
            amount: settlement.amount
        }));

        res.status(200).json({
            success: true,
            totalTransactions: formattedSettlements.length,
            data: formattedSettlements
        });

    } catch (error) {
        console.error('Get settlements error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    createExpense,
    getAllExpenses,
    deleteExpense,
    getBalances,
    getOptimizedSettlements
};
