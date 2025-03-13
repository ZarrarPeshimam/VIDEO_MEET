import React, { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';

// Define types for meeting participants
interface Participant {
    id: string;
    name: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
}

// Define meeting history item type
interface MeetingHistoryItem {
    _id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    meetingLink: string;
    participants: string[];
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    createdAt: string;
}

// Define meeting context state
interface MeetingState {
    meetingId: string | null;
    isJoined: boolean;
    isHost: boolean;
    participants: Participant[];
    isMicEnabled: boolean;
    isCameraEnabled: boolean;
    isScreenSharing: boolean;
    meetingHistory: MeetingHistoryItem[];
    isHistoryLoading: boolean;
}

// Define meeting context actions
interface MeetingActions {
    createMeeting: () => Promise<string>;
    joinMeeting: (meetingId: string, userName: string) => Promise<void>;
    leaveMeeting: () => Promise<void>;
    toggleMic: () => void;
    toggleCamera: () => void;
    toggleScreenShare: () => void;
    kickParticipant: (participantId: string) => void;
    getHistoryOfMeetings: () => Promise<MeetingHistoryItem[]>;
    addMeetingToHistory: (meetingData: Partial<MeetingHistoryItem>) => Promise<void>;
}

// Combine state and actions for the context
type MeetingContextType = MeetingState & MeetingActions;

// Create context with default values
const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

// Provider props type
interface MeetingProviderProps {
    children: ReactNode;
}

export const MeetingProvider: React.FC<MeetingProviderProps> = ({ children }) => {
    const [meetingState, setMeetingState] = useState<MeetingState>({
        meetingId: null,
        isJoined: false,
        isHost: false,
        participants: [],
        isMicEnabled: true,
        isCameraEnabled: true,
        isScreenSharing: false,
        meetingHistory: [],
        isHistoryLoading: false,
    });

    // Create meeting function
    const createMeeting = async (): Promise<string> => {
        try {
            // Generate a random meeting ID
            const newMeetingId = `meeting-${Math.random().toString(36).substring(2, 9)}`;
            
            // Default meeting details with realistic duration
            const startTime = new Date();
            const endTime = new Date(startTime);
            endTime.setMinutes(startTime.getMinutes() + 60); // Default 60 min duration, will be updated on end
            
            // Create meeting in database if user is authenticated
            const token = localStorage.getItem('token');
            if (token) {
                await addMeetingToHistory({
                    title: "Video Meeting",
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    meetingLink: `${window.location.origin}/meeting/${newMeetingId}`,
                    status: 'ongoing'
                });
            }
            
            setMeetingState({
                ...meetingState,
                meetingId: newMeetingId,
                isHost: true,
            });
            
            return newMeetingId;
        } catch (error) {
            console.error('Failed to create meeting:', error);
            throw error;
        }
    };

    // Join meeting function
    const joinMeeting = async (meetingId: string, userName: string): Promise<void> => {
        try {
            // API call to join existing meeting
            // Replace with actual implementation
            const currentUser: Participant = {
                id: `user-${Math.random().toString(36).substring(2, 9)}`,
                name: userName,
                isAudioEnabled: meetingState.isMicEnabled,
                isVideoEnabled: meetingState.isCameraEnabled,
                isScreenSharing: false,
            };

            setMeetingState({
                ...meetingState,
                meetingId,
                isJoined: true,
                participants: [...meetingState.participants, currentUser],
            });
        } catch (error) {
            console.error('Failed to join meeting:', error);
            throw error;
        }
    };

    // Leave meeting function
    const leaveMeeting = async (): Promise<void> => {
        try {
            // API call to leave meeting
            // Replace with actual implementation
            setMeetingState({
                ...meetingState,
                meetingId: null,
                isJoined: false,
                isHost: false,
                participants: [],
            });
        } catch (error) {
            console.error('Failed to leave meeting:', error);
            throw error;
        }
    };

    // Toggle microphone
    const toggleMic = (): void => {
        setMeetingState({
            ...meetingState,
            isMicEnabled: !meetingState.isMicEnabled,
        });
    };

    // Toggle camera
    const toggleCamera = (): void => {
        setMeetingState({
            ...meetingState,
            isCameraEnabled: !meetingState.isCameraEnabled,
        });
    };

    // Toggle screen sharing
    const toggleScreenShare = (): void => {
        setMeetingState({
            ...meetingState,
            isScreenSharing: !meetingState.isScreenSharing,
        });
    };

    // Kick participant (host only)
    const kickParticipant = (participantId: string): void => {
        if (meetingState.isHost) {
            setMeetingState({
                ...meetingState,
                participants: meetingState.participants.filter(p => p.id !== participantId),
            });
        }
    };

    // Get meeting history
    const getHistoryOfMeetings = async (): Promise<MeetingHistoryItem[]> => {
        try {
            setMeetingState(prev => ({ ...prev, isHistoryLoading: true }));
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/users/history`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            if (response.data.success) {
                const meetings = response.data.data;
                setMeetingState(prev => ({ 
                    ...prev, 
                    meetingHistory: meetings,
                    isHistoryLoading: false 
                }));
                return meetings;
            } else {
                throw new Error('Failed to fetch meeting history');
            }
        } catch (error) {
            console.error('Error fetching meeting history:', error);
            setMeetingState(prev => ({ ...prev, isHistoryLoading: false }));
            throw error;
        }
    };

    // Add meeting to history
    const addMeetingToHistory = async (meetingData: Partial<MeetingHistoryItem>): Promise<any> => {
        try {
            // Extract meeting ID from link or use provided ID
            let meetingId;
            if (meetingData.meetingLink) {
                try {
                    const url = new URL(meetingData.meetingLink);
                    const pathParts = url.pathname.split('/');
                    meetingId = pathParts[pathParts.length - 1];
                } catch (error) {
                    meetingId = meetingData.meetingLink.split('/').pop();
                }
            }
            
            const token = localStorage.getItem('token');
            if (!token) {
                console.log("No token found, skipping meeting history update");
                return null;
            }
            
            // Skip checking for existing meeting to avoid potential API errors
            // The backend will handle duplicate detection
            
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_BASE_URL}/users/history`,
                    {
                        ...meetingData,
                        customMeetingId: meetingId,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                
                console.log("Meeting added to history successfully:", response.data);
                return response.data.data;
            } catch (apiError: any) {
                // Log the error but don't rethrow it
                console.error("API error adding meeting to history:", apiError?.response?.data || apiError);
                return null;
            }
        } catch (error: any) {
            console.error("Error in addMeetingToHistory:", error);
            return null;
        }
    };

    const value = {
        ...meetingState,
        createMeeting,
        joinMeeting,
        leaveMeeting,
        toggleMic,
        toggleCamera,
        toggleScreenShare,
        kickParticipant,
        getHistoryOfMeetings,
        addMeetingToHistory,
    };

    return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
};

// Custom hook for using the meeting context
export const useMeeting = (): MeetingContextType => {
    const context = useContext(MeetingContext);
    if (context === undefined) {
        throw new Error('useMeeting must be used within a MeetingProvider');
    }
    return context;
};