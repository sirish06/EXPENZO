const express = require('express');
const router = express.Router();
const { createSettlement, getGroupSettlements } = require('../controllers/settlementController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createSettlement);
router.get('/:groupId', getGroupSettlements);

module.exports = router;
