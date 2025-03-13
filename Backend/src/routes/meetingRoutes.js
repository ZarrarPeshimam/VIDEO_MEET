import { Router } from 'express';
import meetingControllers from '../controllers/meetingControllers.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

// Ensure all meeting routes require authentication
router.use(authMiddleware.authenticateUser);

// Route to update meeting status
router.put("/:meetingId", meetingControllers.updateMeetingStatus);

// Route to get meeting details by ID - add this before the /:meetingId/details route
router.get("/:meetingId", meetingControllers.getMeetingDetails);

// Additional meeting routes
router.post('/create', meetingControllers.createMeeting);
router.post('/join', meetingControllers.joinMeeting);
router.post('/leave', meetingControllers.leaveMeeting);
router.post('/end', meetingControllers.endMeeting);
router.get('/:meetingId/details', meetingControllers.getMeetingDetails);

export default router;
