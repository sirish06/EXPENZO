const express = require('express');
const router = express.Router();
const { getBalances, getUserSummary } = require('../controllers/balanceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/user/summary', getUserSummary);
router.get('/:groupId', getBalances);

module.exports = router;
