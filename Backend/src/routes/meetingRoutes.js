import { Router } from 'express';
import meetingControllers from '../controllers/meetingControllers.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

// Route to update meeting status
router.put("/:meetingId", authMiddleware.authenticateUser, meetingControllers.updateMeetingStatus);

// Route to get meeting details by ID - add this before the /:meetingId/details route
router.get("/:meetingId", authMiddleware.authenticateUser, meetingControllers.getMeetingDetails);

// Additional meeting routes
router.post('/create', authMiddleware.authenticateUser, meetingControllers.createMeeting);
router.post('/join', authMiddleware.authenticateUser, meetingControllers.joinMeeting);
router.post('/leave', authMiddleware.authenticateUser, meetingControllers.leaveMeeting);
router.post('/end', authMiddleware.authenticateUser, meetingControllers.endMeeting);
router.get('/:meetingId/details', authMiddleware.authenticateUser, meetingControllers.getMeetingDetails);

export default router;
