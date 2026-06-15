const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createGroup, joinByInviteCode, getGroups, getGroupById,
  updateGroup, deleteGroup, regenerateInviteCode, removeMember, leaveGroup
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

const groupValidation = [
  body('name').trim().notEmpty().withMessage('Group name is required')
];

router.use(protect);

router.post('/create', groupValidation, createGroup);
router.post('/join', joinByInviteCode);
router.get('/', getGroups);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.post('/:id/regen-invite', regenerateInviteCode);
router.delete('/:id/members/:userId', removeMember);
router.post('/:id/leave', leaveGroup);

module.exports = router;
