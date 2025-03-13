import meetingModel from '../models/meetingModel.js';

const updateMeetingStatus = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { status, endTime } = req.body;
        
        if (!meetingId) {
            return res.status(400).json({
                success: false,
                message: 'Meeting ID is required'
            });
        }
        
        // Create query conditions to find the meeting by ID or link
        let queryConditions;
        
        // Check if meetingId is a valid ObjectId
        const isValidObjectId = meetingId.match(/^[0-9a-fA-F]{24}$/);
        
        if (isValidObjectId) {
            // If it's a valid ObjectId, search by _id
            queryConditions = { _id: meetingId };
        } else {
            // For custom format IDs, search by meetingLink containing the ID 
            // or by the custom ID directly if you store it separately
            queryConditions = { 
                $or: [
                    { meetingLink: { $regex: meetingId, $options: 'i' } },
                    { customMeetingId: meetingId } // If you store custom IDs separately
                ]
            };
        }
        
        // Find and update the meeting
        const updatedMeeting = await meetingModel.findOneAndUpdate(
            queryConditions,
            { 
                status, 
                endTime,
                // Add a timestamp for the update
                updatedAt: new Date()
            },
            { 
                new: true,
                runValidators: true 
            }
        );
        
        if (!updatedMeeting) {
            console.log(`Meeting not found with criteria:`, queryConditions);
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Meeting status updated successfully',
            data: updatedMeeting
        });
    } catch (err) {
        console.error('Error updating meeting status:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Create a new meeting
const createMeeting = async (req, res) => {
    try {
        const { title, description, startTime, endTime, meetingLink, password, isRecurring } = req.body;
        const hostId = req.user._id;
        
        const meeting = await meetingModel.create({
            title,
            description,
            startTime,
            endTime,
            hostId,
            meetingLink,
            password,
            isRecurring,
            status: 'scheduled'
        });
        
        return res.status(201).json({
            success: true,
            message: 'Meeting created successfully',
            data: meeting
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Join an existing meeting
const joinMeeting = async (req, res) => {
    try {
        const { meetingId } = req.body;
        const userId = req.user._id;
        
        const meeting = await meetingModel.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }
        
        // Add user to participants if not already included
        if (!meeting.participants.includes(userId)) {
            meeting.participants.push(userId);
            await meeting.save();
        }
        
        return res.status(200).json({
            success: true,
            message: 'Joined meeting successfully',
            data: meeting
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Leave a meeting
const leaveMeeting = async (req, res) => {
    try {
        const { meetingId } = req.body;
        const userId = req.user._id;
        
        const meeting = await meetingModel.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }
        
        // Remove user from participants
        meeting.participants = meeting.participants.filter(
            participant => participant.toString() !== userId.toString()
        );
        await meeting.save();
        
        return res.status(200).json({
            success: true,
            message: 'Left meeting successfully'
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// End a meeting (host only)
const endMeeting = async (req, res) => {
    try {
        const { meetingId } = req.body;
        const userId = req.user._id;
        
        const meeting = await meetingModel.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }
        
        // Verify that the user is the host
        if (meeting.hostId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the meeting host can end the meeting'
            });
        }
        
        // Update meeting status to completed
        meeting.status = 'completed';
        meeting.endTime = new Date();
        await meeting.save();
        
        return res.status(200).json({
            success: true,
            message: 'Meeting ended successfully',
            data: meeting
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get meeting details
const getMeetingDetails = async (req, res) => {
    try {
        const { meetingId } = req.params;
        
        // Create query conditions to find the meeting by ID or link
        let queryConditions;
        
        // Check if meetingId is a valid ObjectId
        const isValidObjectId = meetingId.match(/^[0-9a-fA-F]{24}$/);
        
        if (isValidObjectId) {
            // If it's a valid ObjectId, search by _id
            queryConditions = { _id: meetingId };
        } else {
            // For custom format IDs, search by meetingLink containing the ID 
            // or by the custom ID directly
            queryConditions = { 
                $or: [
                    { meetingLink: { $regex: meetingId, $options: 'i' } },
                    { customMeetingId: meetingId } 
                ]
            };
        }
        
        // First get the meeting without populating to avoid potential issues
        const meeting = await meetingModel.findOne(queryConditions);
            
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }
        
        // Try to populate, but handle errors gracefully
        try {
            // Only try to populate if the references exist
            if (meeting.hostId) {
                await meeting.populate('hostId', 'name email');
            }
            if (meeting.participants && meeting.participants.length > 0) {
                await meeting.populate('participants', 'name email');
            }
        } catch (populateErr) {
            console.warn("Error populating meeting references:", populateErr);
            // Continue with the unpopulated meeting
        }
        
        return res.status(200).json({
            success: true,
            message: 'Meeting details retrieved successfully',
            data: meeting
        });
    } catch (err) {
        console.error("Error getting meeting details:", err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export default { 
    updateMeetingStatus,
    createMeeting,
    joinMeeting,
    leaveMeeting,
    endMeeting,
    getMeetingDetails
};
