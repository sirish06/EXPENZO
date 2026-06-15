const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { addExpense, getExpenses, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

const expenseValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('groupId').notEmpty().withMessage('Group ID is required')
];

router.use(protect);

router.post('/add', expenseValidation, addExpense);
router.get('/:groupId', getExpenses);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
