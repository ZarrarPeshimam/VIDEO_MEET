import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    meetingLink: {
        type: String,
        required: true,
        unique: true
    },
    customMeetingId: {
        type: String,
        index: true // Add an index for better query performance
    },
    password: {
        type: String
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true 
});

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;