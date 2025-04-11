
const express = require('express');
const {
  getTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  bulkCreateTimeSlots
} = require('../controllers/timeSlotController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

const timeSlotValidation = [
  check('teacherId', 'Teacher ID is required').not().isEmpty(),
  check('date', 'Date is required').not().isEmpty(),
  check('startTime', 'Start time is required').not().isEmpty(),
  check('endTime', 'End time is required').not().isEmpty()
];

router
  .route('/')
  .get(getTimeSlots)
  .post(
    timeSlotValidation,
    createTimeSlot
  );

router
  .route('/bulk')
  .post(
    bulkCreateTimeSlots
  );

router
  .route('/:id')
  .put(updateTimeSlot)
  .delete(deleteTimeSlot);

module.exports = router;
