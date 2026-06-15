const express = require('express');
const router = express.Router();
const { getGroupActivity, getUserActivityFeed } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Must come before /:groupId to avoid conflict
router.get('/user/feed', getUserActivityFeed);
router.get('/:groupId', getGroupActivity);

module.exports = router;
