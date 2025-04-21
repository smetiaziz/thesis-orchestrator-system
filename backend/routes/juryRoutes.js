
const express = require('express');
const {
  getJuries,
  getJury,
  createJury,
  updateJury,
  deleteJury,
  getScheduledDates,
  getJuriesByDate
} = require('../controllers/juryController');
const { autoGenerateJuries } = require('../controllers/juryAutoController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

const juryValidation = [
  check('pfeTopicId', 'PFE topic ID is required').not().isEmpty(),
  check('supervisorId', 'Supervisor ID is required').not().isEmpty(),
  check('presidentId', 'President ID is required').not().isEmpty(),
  check('reporterId', 'Reporter ID is required').not().isEmpty(),
  check('date', 'Date is required').not().isEmpty(),
  check('startTime', 'Start time is required').not().isEmpty(),
  check('endTime', 'End time is required').not().isEmpty(),
  check('location', 'Location is required').not().isEmpty()
];

router
  .route('/')
  .get(getJuries)
  .post(
    authorize('admin', 'departmentHead'),
    juryValidation,
    createJury
  );

router
  .route('/scheduled-dates')
  .get(getScheduledDates);

router
  .route('/date/:date')
  .get(getJuriesByDate);

router
  .route('/auto-generate')
  .post(
    authorize('admin', 'departmentHead'),
    autoGenerateJuries
  );

router
  .route('/:id')
  .get(getJury)
  .put(
    authorize('admin', 'departmentHead'),
    updateJury
  )
  .delete(
    authorize('admin', 'departmentHead'),
    deleteJury
  );

module.exports = router;
