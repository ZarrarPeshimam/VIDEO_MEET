import { useState, useRef, useEffect, useContext } from 'react'
import '../styles/VideoMeetingPage.css'
// Update import to use TypeScript version
import { updateVideoLayout, markAsScreenShare, updateLocalVideoPosition } from "../scripts/videoLayoutManager";
import { UserContext } from '../contexts/userContext'
import { useAuthCheck, validateMeetingAccess } from '../utils/AuthUtils'

import { IconButton, Button, TextField, Alert } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import PresentToAllIcon from "@mui/icons-material/PresentToAll"; // Changed from ScreenshareIcon
import CancelPresentationIcon from "@mui/icons-material/CancelPresentation"; // Changed from StopscreenshareIcon
import ChatIcon from "@mui/icons-material/Chat";
import PeopleIcon from "@mui/icons-material/People";
import ThreeDotsIcon from "@mui/icons-material/MoreVert";
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

// Define types for your WebRTC connections
type ConnectionsType = {
  [key: string]: RTCPeerConnection;
};

// Define type for video streams
interface VideoStream {
  socketId: string;
  stream: MediaStream;
  autoPlay: boolean;
  playsInline: boolean;
  isScreenShare?: boolean;
}

// Add server URL
const server_url ='http://localhost:3000';

// Define peer connection config
const peerConfigConnection: RTCConfiguration = {
  iceServers: [
    { 
      urls: "stun:stun.l.google.com:19302"
    },
    {
      urls: "turn:numb.viagenie.ca",
      credential: "muazkh",
      username: "webrtc@live.com"
    }
  ]
};

// Extending Window interface to include localStream property
declare global {
  interface Window {
    localStream: MediaStream;
  }
}

export default function VideoMeetingPage() {
  const navigate = useNavigate();
  const { meetingId, url } = useParams(); // Get meeting ID from URL params
  const actualMeetingId = meetingId || url; // Use either meetingId or url param
  
  const { user } = useContext(UserContext);
  const { isAuthenticated, loading } = useAuthCheck();
  const [meetingAccessChecked, setMeetingAccessChecked] = useState(false);
  const [meetingAccessError, setMeetingAccessError] = useState<string | null>(null);
  
  const [participentModal, setParticipentModal] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [videoAvailable, setVideoAvailable] = useState<boolean>(true);
  const [audioAvailable, setAudioAvailable] = useState<boolean>(true);
  const [video, setVideo] = useState<boolean>(false);
  const [audio, setAudio] = useState<boolean>(false);
  const [screen, setScreen] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false); // Added to track actual screen sharing state
  const [screenAvailable, setScreenAvailable] = useState<boolean>(false);
  const [messages, setMessages] = useState<{data: string, sender: string}[]>([]);
  const [message, setMessage] = useState<string>("");
  const [newMessages, setNewMessages] = useState<number>(0);
  const [askForUsername, setAskForUsername] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");
  const [videos, setVideos] = useState<VideoStream[]>([]);
  const [localStreamReady, setLocalStreamReady] = useState<boolean>(false);
  const pendingConnectionsRef = useRef<string[]>([]);
  
  // Add missing refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<any>(null);
  const socketIdRef = useRef<string>("");
  
  // Create connections object
  const connections: ConnectionsType = {};

  // Add a ref for the chat display container
  const chatDisplayRef = useRef<HTMLDivElement>(null);

  // Add ref for remote video container
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null);
  const localVideoContainerRef = useRef<HTMLDivElement>(null);

  // Add these state variables to the component
  const [connectionRetryCount, setConnectionRetryCount] = useState<{[key: string]: number}>({});
  const streamReadyRef = useRef<boolean>(false);

  const closeParticipantModal = () => {
    setIsClosing(true)
    timeoutRef.current = setTimeout(() => {
      setParticipentModal(false)
      setIsClosing(false)
    }, 500)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, []);

  // Update the getPermissions function to properly handle stream readiness
  const getPermissions = async () => {
    try {
      console.log("Getting media permissions...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setVideoAvailable(true);
      setAudioAvailable(true);
      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
      
      setVideo(true);
      setAudio(true);

      window.localStream = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Set both state and ref for stream readiness
      setLocalStreamReady(true);
      streamReadyRef.current = true;
      console.log("Local stream initialized successfully");
      
      // Process any pending connections that came in before stream was ready
      if (pendingConnectionsRef.current.length > 0 && socketRef.current) {
        console.log("Processing pending connections:", pendingConnectionsRef.current);
        const pendingConnections = [...pendingConnectionsRef.current];
        pendingConnectionsRef.current = [];
        
        // Process the pending connections with a small delay to ensure all states are updated
        setTimeout(() => {
          pendingConnections.forEach(clientId => {
            createConnectionForClient(clientId, true);
          });
        }, 500);
      }
    } catch (err) {
      console.error("Error getting media permissions:", err);
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setVideoAvailable(false);
        setAudioAvailable(false);
      }
      
      // Even with no devices, we should create a black/silent stream
      console.log("Creating fallback black/silent stream");
      let BlackSilence = (...args) => new MediaStream([silence(), black(...args)]);
      window.localStream = BlackSilence();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = window.localStream;
      }
      setLocalStreamReady(true);
    }
  };

  // Create a helper function to set up a connection with proper error handling
  const createConnectionForClient = (clientId: string, createOffer = false) => {
    if (clientId === socketRef.current?.id) return;
    
    console.log("Creating/updating connection for:", clientId);
    
    // Check if stream is ready using both state and ref for reliability
    if (!window.localStream || !streamReadyRef.current) {
      console.warn("Local stream not ready, queueing connection for:", clientId);
      if (!pendingConnectionsRef.current.includes(clientId)) {
        pendingConnectionsRef.current.push(clientId);
      }
      return;
    }
    
    // Create new RTCPeerConnection if it doesn't exist
    if (!connections[clientId]) {
      console.log("Creating new RTCPeerConnection for:", clientId);
      connections[clientId] = new RTCPeerConnection(peerConfigConnection);
      
      // Handle ICE candidates
      connections[clientId].onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          console.log("Sending ICE candidate to:", clientId);
          socketRef.current.emit(
            "signal",
            clientId,
            JSON.stringify({ ice: event.candidate })
          );
        }
      };
      
      // Track ICE connection state changes
      connections[clientId].oniceconnectionstatechange = () => {
        const connectionState = connections[clientId].iceConnectionState;
        console.log(`ICE connection state for ${clientId}: ${connectionState}`);
        
        // Handle failed connections with retry logic
        if (connectionState === 'failed' || connectionState === 'disconnected') {
          const retryCount = connectionRetryCount[clientId] || 0;
          if (retryCount < 3) {
            console.log(`Retrying connection to ${clientId}, attempt ${retryCount + 1}`);
            // Wait a bit before retrying
            setTimeout(() => {
              // Close the old connection
              connections[clientId].close();
              delete connections[clientId];
              
              // Increment retry count
              setConnectionRetryCount(prev => ({
                ...prev,
                [clientId]: retryCount + 1
              }));
              
              // Create a new connection
              createConnectionForClient(clientId, true);
            }, 1000);
          } else {
            console.log(`Maximum retry attempts reached for ${clientId}`);
          }
        }
      };
      
      // Handle remote stream
      connections[clientId].onaddstream = (event) => {
        console.log("Received stream from:", clientId, event.stream);
        
        setVideos((prevVideos) => {
          const existing = prevVideos.find(v => v.socketId === clientId);
          if (existing) {
            console.log("Video already exists for:", clientId);
            return prevVideos;
          }
          
          console.log("Adding new video for:", clientId);
          return [
            ...prevVideos,
            {
              socketId: clientId,
              stream: event.stream,
              autoPlay: true,
              playsInline: true,
            },
          ];
        });
      };
      
      // Add local stream to the new connection
      try {
        if (window.localStream) {
          console.log("Adding local stream to new connection:", clientId);
          connections[clientId].addStream(window.localStream);
        }
      } catch (err) {
        console.error("Error adding stream to new connection:", err);
      }
    }
    
    // If createOffer flag is true, create an offer
    if (createOffer && window.localStream) {
      console.log("Creating offer for:", clientId);
      connections[clientId]
        .createOffer()
        .then((description) => {
          console.log("Setting local description for:", clientId);
          connections[clientId]
            .setLocalDescription(description)
            .then(() => {
              console.log("Sending signal to:", clientId);
              socketRef.current.emit(
                "signal",
                clientId,
                JSON.stringify({
                  sdp: connections[clientId].localDescription,
                })
              );
            })
            .catch((e) => console.error("Error setting local description:", e));
        })
        .catch((e) => console.error("Error creating offer:", e));
    }
  };

  const getUserMediaSuccess = (stream: MediaStream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.log(err);
    }
    window.localStream = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    for (let peerId in connections) {
      if (peerId === socketRef.current.id) {
        continue;
      }
      connections[peerId].addStream(window.localStream);
      connections[peerId].createOffer().then((description) => {
        connections[peerId]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              peerId,
              JSON.stringify({ sdp: connections[peerId].localDescription })
            );
          })
          .catch((err) => console.log(err));
      });
    }
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);
          try {
            if (localVideoRef.current && localVideoRef.current.srcObject) {
              const stream = localVideoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach((track) => track.stop());
            }
          } catch (err) {
            console.log(err);
          }
          //Todo BlackSilence
          let BlackSilence = (...args) =>
            new MediaStream([silence(), black(...args)]);
          window.localStream = BlackSilence();
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = window.localStream;
          }
          for (let peerId in connections) {
            if (peerId === socketRef.current.id) {
              continue;
            }
            connections[peerId].removeStream(window.localStream);
            connections[peerId].createOffer().then((description) => {
              connections[peerId]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    peerId,
                    JSON.stringify({
                      sdp: connections[peerId].localDescription,
                    })
                  );
                })
                .catch((err) => console.log(err));
            });
          }
        })
    );
  };
  const silence = () => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  const black = ({ width = 640, height = 480 } = {}) => {
    const canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d")?.fillRect(0, 0, width, height);
    const stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({
          video: videoAvailable ? video : false,
          audio: audioAvailable ? audio : false,
        })
        .then(getUserMediaSuccess)
        .catch((err) => {
          console.log(err);
        });
    } else {
      try {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          const stream = localVideoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.log(err);
      }
    }
  };

  const gotMessageFromServer = (fromId: string, message: string) => {
    const signal = JSON.parse(message);
    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      if (socketRef.current) {
                        socketRef.current.emit(
                          "signal",
                          fromId,
                          JSON.stringify({
                            sdp: connections[fromId].localDescription,
                          })
                        );
                      }
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  const addMessage = (data: string, sender: string, socketIdSender: string) => {
    setMessages((prevMessages) => [...prevMessages, {data, sender}]);
    if(socketIdSender !== socketIdRef.current){
      setNewMessages((prevMessages) => (prevMessages || 0) + 1);
    }
  };

  // Add useEffect to scroll to bottom when messages change
  useEffect(() => {
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [messages]);

  // Update layout whenever videos array changes or screen sharing state changes
  useEffect(() => {
    if (remoteVideoContainerRef.current) {
      updateVideoLayout(remoteVideoContainerRef.current, videos.length, isScreenSharing);
    }
    
    if (localVideoContainerRef.current) {
      updateLocalVideoPosition(localVideoContainerRef.current, videos.length, isScreenSharing);
    }
  }, [videos.length, isScreenSharing]);

  // Update socket event handlers for user joining
  const connectToSocketServer = () => {
    console.log("Connecting to socket server:", server_url);
    
    // Clean up any existing connection
    if (socketRef.current) {
      socketRef.current.offAny();
      socketRef.current.disconnect();
    }
    
    socketRef.current = io(server_url, { secure: true });

    socketRef.current.on("signal", (fromId: string, message: string) => {
      console.log("Signal received from:", fromId);
      gotMessageFromServer(fromId, message);
    });

    // Make sure these event handlers are only registered once
    socketRef.current.once("connect", () => {
      console.log("Connected to socket server with ID:", socketRef.current.id);
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", (data: string, sender: string, socketIdSender: string) => {
      console.log("Chat message received from:", sender);
      addMessage(data, sender, socketIdSender);
      });

      socketRef.current.on("user-left", (id: string) => {
      console.log("User left:", id);
      
      // Close and clean up the connection
      if (connections[id]) {
        connections[id].close();
        delete connections[id];
      }
      
      setVideos((prevVideos) => prevVideos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (userId: string, clients: string[]) => {
      console.log("User joined:", userId, "Current clients:", clients);

      if (!clients || !Array.isArray(clients)) {
        console.error("Invalid clients data received:", clients);
        return;
      }

      // Create connections for all clients except self
      clients.forEach((clientId) => {
        if (clientId !== socketRef.current.id) {
          createConnectionForClient(clientId);
        }
      });

      // If we're the new user, initiate offers to all existing users
      if (userId === socketRef.current.id && streamReadyRef.current) {
        console.log("I'm the new user, initiating connections");
        clients.forEach((clientId) => {
          if (clientId === socketRef.current.id) return;
          
          // Create connections with offers if local stream is ready
          if (window.localStream && streamReadyRef.current) {
            createConnectionForClient(clientId, true);
          } else {
            console.warn("Local stream not ready, postponing offer creation for:", clientId);
            if (!pendingConnectionsRef.current.includes(clientId)) {
              pendingConnectionsRef.current.push(clientId);
            }
          }
        });
      }
      });
    });

    socketRef.current.on("connect_error", (error: Error) => {
      console.error("Socket connection error:", error);
    });

    socketRef.current.on("disconnect", (reason: string) => {
      console.log("Socket disconnected:", reason);
    });
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio]);

  // Modify the getMedia function to be more reliable
  const getMedia = async () => {
    try {
      setVideo(videoAvailable);
      setAudio(audioAvailable);
      await getUserMedia();  // Wait for getUserMedia to complete
      
      // Wait a bit to ensure the stream is fully initialized before connecting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      connectToSocketServer(); // Connect to socket server after media is ready
    } catch (err) {
      console.error("Error in getMedia:", err);
      // Fall back to a black/silent stream if there's an error
      let BlackSilence = (...args) => new MediaStream([silence(), black(...args)]);
      window.localStream = BlackSilence();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = window.localStream;
      }
      streamReadyRef.current = true;
      setLocalStreamReady(true);
      connectToSocketServer();
    }
  };

  const connect = () => {
    if (username !== "") {
      setAskForUsername(false);
      getMedia();
    }
  };

  const handleVideo = () => {
    setVideo(!video);
  };
  const handleAudio = () => {
    setAudio(!audio);
  };

  const getDisplayMediaSuccess = (stream: MediaStream) => {
    try{
      window.localStream.getTracks().forEach(track => track.stop());
    }catch(err){
      console.error("Error: ", err);}

    window.localStream = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      // Mark the local video as screen sharing
      markAsScreenShare(localVideoRef.current, true);
    }

    // Update screen sharing state
    setIsScreenSharing(true);

    for(let peerId in connections){
      if(peerId === socketRef.current.id){
        continue;
      }
      connections[peerId].addStream(window.localStream);
      connections[peerId].createOffer().then(description => {
        connections[peerId].setLocalDescription(description).then(() => {
          socketRef.current.emit("signal", peerId, JSON.stringify({sdp: connections[peerId].localDescription}));
        }).catch(err => console.error("Error: ", err));
      }).catch(err => console.error("Error: ", err));
    }
    
    stream.getTracks().forEach(track => track.onended = () => {
      setScreen(false);
      setIsScreenSharing(false); // Update screen sharing state when ended
      
      if (localVideoRef.current) {
        // Unmark as screen sharing
        markAsScreenShare(localVideoRef.current, false);
      }
      
      try{
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          const stream = localVideoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      }catch(err){
        console.error("Error: ", err);
      }
      let BlackSilence = (...args) => new MediaStream([silence(), black(...args)]);
      window.localStream = BlackSilence();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = window.localStream;
      }

      getUserMedia();
    });
  };

  const getDisplayMedia = () => {
    if(!isScreenSharing){
      if(navigator.mediaDevices.getDisplayMedia){
        try{
          navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
          .then(getDisplayMediaSuccess)
          .catch(err => {
            console.error("Error getting display media: ", err);
            setScreen(false);
          });
        }catch(err){
          console.error("Error: ", err);
          setScreen(false);
        }
      }
    } else {
      // If already screen sharing, stop it
      try {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          const stream = localVideoRef.current.srcObject as MediaStream;
          const screenTracks = stream.getVideoTracks();
          screenTracks.forEach(track => track.stop());
          setIsScreenSharing(false);
          setScreen(false);
          getUserMedia(); // Go back to camera
        }
      } catch(err) {
        console.error("Error stopping screen share: ", err);
      }
    }
  };

  const handleScreen = () => {
    // Only allow screen sharing after username is entered
    if (!askForUsername) {
      if (!isScreenSharing) {
        setScreen(true);
        getDisplayMedia();
      } else {
        setScreen(false);
        try {
          if (localVideoRef.current && localVideoRef.current.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream;
            const screenTracks = stream.getVideoTracks();
            screenTracks.forEach(track => track.stop());
            setIsScreenSharing(false);
            getUserMedia(); // Go back to camera
          }
        } catch(err) {
          console.error("Error stopping screen share: ", err);
        }
      }
    }
  };

  const sendMessage = () => {
    if (message.trim() === '') return;
    
    // Add message to local state immediately (don't wait for server echo)
    addMessage(message, username, socketIdRef.current);
    
    // Emit to other participants
    socketRef.current.emit("chat-message", message, username);
    
    // Clear input
    setMessage("");
  };

  // Add utility function to properly stop a media stream
  const stopMediaStream = (stream: MediaStream | null) => {
    if (!stream) return;
    
    try {
      // Stop all tracks individually
      stream.getTracks().forEach(track => {
        track.stop();
        stream.removeTrack(track); // Remove track from stream
      });
    } catch (err) {
      console.error("Error stopping media stream tracks:", err);
    }
  };

  // Update this function to handle the custom meeting ID format
  const updateMeetingStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No token found, skipping meeting status update");
        return;
      }

      // Extract meeting ID from URL
      const pathParts = window.location.pathname.split('/');
      const meetingId = pathParts[pathParts.length - 1];
      
      console.log("Updating meeting status for ID:", meetingId);
      
      // Current timestamp for accurate end time
      const endTimeStamp = new Date().toISOString();
      
      // First check if the meeting already exists
      try {
        const checkResponse = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/meetings/${meetingId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // If meeting exists, update it
        if (checkResponse.data.success) {
          console.log("Found existing meeting, updating status");
        }
      } catch (error) {
        console.log("Meeting not found, no update needed");
        return null;
      }
      
      // Call API to update meeting status
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/meetings/${meetingId}`,
        {
          status: 'completed',
          endTime: endTimeStamp
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        console.log("Meeting status updated successfully");
      } else {
        console.error("Failed to update meeting status:", response.data);
      }
      
      return response;
    } catch (error) {
      console.error("Failed to update meeting status:", error);
      // Don't rethrow so we don't block navigation
      return null;
    }
  };

  const handleEndCall = async () => {
    console.log("Ending call and cleaning up resources...");
    
    try {
      // First update meeting status before any potential issues with media cleanup
      await updateMeetingStatus();
      
      // Stop screen sharing if active
      if (isScreenSharing) {
        setIsScreenSharing(false);
        setScreen(false);
      }
      
      // Stop local video/audio tracks and clear references
      if (window.localStream) {
        console.log("Stopping local stream tracks...");
        stopMediaStream(window.localStream);
        window.localStream = null as any; // Clear reference
      }
      
      // Stop tracks from video element source
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        console.log("Stopping video element source stream...");
        const stream = localVideoRef.current.srcObject as MediaStream;
        stopMediaStream(stream);
        
        // Clear source
        localVideoRef.current.srcObject = null;
      }
      
      // Close all peer connections properly
      console.log("Closing all peer connections...");
      Object.entries(connections).forEach(([id, connection]) => {
        if (connection) {
          // Remove all event listeners
          connection.onicecandidate = null;
          connection.onaddstream = null;
          connection.onremovestream = null;
          connection.oniceconnectionstatechange = null;
          
          // Close the connection
          connection.close();
          delete connections[id]; // Remove reference
        }
      });
      
      // Disconnect from socket and remove all listeners
      if (socketRef.current) {
        console.log("Disconnecting socket...");
        socketRef.current.offAny(); // Remove all event listeners
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Reset all state
      setVideo(false);
      setAudio(false);
      setScreen(false);
      setIsScreenSharing(false);
      setVideos([]); // Clear videos array
      
      console.log("All media resources cleaned up successfully");
    } catch (err) {
      console.error("Error during call cleanup:", err);
    } finally {
      // Small delay to ensure all cleanup completes
      setTimeout(() => {
        // Navigate back to home after cleanup
        navigate("/home");
      }, 100);
    }
  };

  // Update cleanup in useEffect to use the same thorough cleanup
  useEffect(() => {
    getPermissions();
    
    return () => {
      console.log("Component unmounting, cleaning up resources...");
      // Clean up peer connections
      Object.values(connections).forEach((connection) => {
        if (connection) {
          connection.onicecandidate = null;
          connection.onaddstream = null;
          connection.close();
        }
      });
      
      // Clean up media streams
      if (window.localStream) {
        stopMediaStream(window.localStream);
        window.localStream = null as any;
      }
      
      // Clean up socket
      if (socketRef.current) {
        socketRef.current.offAny();
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Check for logged-in user and set username if available
  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user?.name) {
        // User is authenticated and we have their name
        setUsername(user.name);
        setAskForUsername(false);
        getMedia();
      } else {
        // Check local storage as fallback
        const token = localStorage.getItem('token');
        
        if (!token) {
          // If no token and not on localhost, redirect to login
          if (!window.location.hostname.includes('localhost')) {
            navigate('/login');
          }
        } else {
          // We have a token but no user data yet - the auth check will handle loading it
          // Just show the username prompt until data loads
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData);
              if (userData.name) {
                setUsername(userData.name);
                setAskForUsername(false);
                getMedia();
              }
            } catch (e) {
              console.error("Error parsing stored user data", e);
            }
          }
        }
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  // First check if the user has access to this meeting
  useEffect(() => {
    const checkMeetingAccess = async () => {
      if (!loading && isAuthenticated && actualMeetingId) {
        try {
          const result = await validateMeetingAccess(actualMeetingId);
          
          if (result.success) {
            console.log("Meeting access granted:", result.meetingData);
            setMeetingAccessChecked(true);
          } else {
            console.error("Meeting access denied:", result.message);
            setMeetingAccessError(result.message);
          }
        } catch (error) {
          console.error("Error checking meeting access:", error);
          setMeetingAccessError("Failed to validate meeting access");
        }
      }
    };
    
    checkMeetingAccess();
  }, [loading, isAuthenticated, actualMeetingId]);
  
  // When user is authenticated and has meeting access, get media first, then connect
  useEffect(() => {
    if (isAuthenticated && meetingAccessChecked && !askForUsername && username) {
      // First get media, then socket connection will follow
      getMedia();
    }
  }, [isAuthenticated, meetingAccessChecked, askForUsername, username]);

  // Add another effect to handle reconnections when local stream becomes available
  useEffect(() => {
    // When local stream becomes ready, process any pending connections
    if (localStreamReady && pendingConnectionsRef.current.length > 0 && socketRef.current) {
      console.log("Local stream now ready, processing pending connections");
      const pendingConnections = [...pendingConnectionsRef.current];
      pendingConnectionsRef.current = [];
      
      // Process connections with a small delay to ensure state is fully updated
      setTimeout(() => {
        pendingConnections.forEach(clientId => {
          createConnectionForClient(clientId, true);
        });
      }, 500);
    }
  }, [localStreamReady]);

  // Add a useEffect to reset stream ready status when the component unmounts
  useEffect(() => {
    // Set initial state
    streamReadyRef.current = false;
    
    return () => {
      // Reset on unmount
      streamReadyRef.current = false;
      setLocalStreamReady(false);
    };
  }, []);

  return (
    <>
    {loading ? (
      <div className="loading-screen">
        <h2>Loading...</h2>
      </div>
    ) : !isAuthenticated ? (
      <div className="auth-error-screen">
        <Alert severity="error">
          You must be logged in to join this meeting.
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/login')}
          sx={{ mt: 2 }}
        >
          Go to Login
        </Button>
      </div>
    ) : meetingAccessError ? (
      <div className="meeting-error-screen">
        <Alert severity="error">
          {meetingAccessError}
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/home')}
          sx={{ mt: 2 }}
        >
          Return to Home
        </Button>
      </div>
    ) : askForUsername ? (
        <div className="modal">
          <div className="modal-box">
            <h1>Enter your username</h1>
            <TextField
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button variant="contained" onClick={connect}>
              Connect
            </Button>
          </div>
        </div>
    ): (
      <div className='main-root-container'>
      <div className='video-meeting-page-container'>
          <div className="main-video-container">
            <div 
              className="local-video-container"
              ref={localVideoContainerRef}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`local-video ${isScreenSharing ? 'screen-share' : ''}`}
              ></video>
            </div>
            <div 
              className="remote-video-container"
              ref={remoteVideoContainerRef}
            >
              {videos.length === 0 ? (
                <div className="no-remote-videos">
                  <p>No other participants</p>
                </div>
              ) : (
                videos.map((video, index) => (
                  <video
                    key={index}
                    data-socket-id={video.socketId}
                    ref={(ref) => {
                      if (ref && video.stream) {
                        ref.srcObject = video.stream;
                      }}}
                    autoPlay
                    playsInline
                    className={`remote-video ${video.isScreenShare ? 'screen-share' : ''}`}
                  ></video>
                ))
              )}
            </div>
          </div>
          <div className="main-chat-container">
            <div className="chat-header">
              <h2>In-Call Messages</h2>
            </div>
            <div className="chat-security-info">
              <p>Message can only be seen by people in the call and are deleted when the call ends</p>
            </div>
            <div className="chat-display" ref={chatDisplayRef}>
            {messages.map((msg, index) => {
              // Format timestamp
              const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              
              return (
                <div key={index} className={`message ${msg.sender === username ? 'my-message' : 'other-message'}`}>
                  <div className="message-header">
                    <span className="message-sender">{msg.sender === username ? 'You' : msg.sender}</span>
                    <span className="message-time">{timestamp}</span>
                  </div>
                  <p className="message-content">{msg.data}</p>
                </div>
              );
            })}
            </div>
            <div className="chat-input">
              <input 
                type="text" 
                placeholder="Type a message" 
                className='outline-none text-white w-60'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && message.trim() && sendMessage()}
              />
              <i 
                className="fas fa-paper-plane cursor-pointer" 
                onClick={() => message.trim() && sendMessage()}
              ></i>
            </div>
          </div>
          <div className="icon-container">
            <IconButton className='icon-button' onClick={handleVideo}>
              {
                video ? <VideocamIcon fontSize="medium" /> : <VideocamOffIcon fontSize="medium" />
              }
            </IconButton>
            <IconButton className='icon-button' onClick={handleAudio}>
              {
                audio ? <MicIcon fontSize="medium" /> : <MicOffIcon fontSize="medium" />
              }
            </IconButton>

            <IconButton className='icon-button' onClick={handleScreen}>
              {
                isScreenSharing ? <CancelPresentationIcon fontSize="medium" /> : <PresentToAllIcon fontSize="medium" />
              }
            </IconButton >
            <IconButton className='icon-button call-end' style={{ backgroundColor: 'red', color: 'white' }} onClick={handleEndCall}>
              <CallEndIcon fontSize="medium" />
            </IconButton>
            <IconButton className='icon-button' onClick={() => participentModal ? closeParticipantModal() : setParticipentModal(true)}>
              <ChatIcon fontSize="medium" />
            </IconButton >
            <IconButton className='icon-button' onClick={() => participentModal ? closeParticipantModal() : setParticipentModal(true)}>
              <PeopleIcon fontSize="medium" />
            </IconButton>
            <IconButton className='icon-button'>
              <ThreeDotsIcon fontSize="medium" />
            </IconButton>
          </div>
      </div>
      {participentModal && (
        <div className={`main-participent-container ${isClosing ? 'closing' : ''}`}>
          <div className="participent-header">
            <h2 className='text-xl pl-1'>People</h2>
            <i className="fa-solid fa-xmark cursor-pointer" onClick={closeParticipantModal}></i>
          </div>
          <div className="add-people">
          <i className="fa-solid fa-user-plus"></i>
          <p>Add People</p>
          </div>
          <p className='pl-8 text-white mt-7 opacity-80 text-xs'>IN THE MEETING</p>
          <div className="people-in-meeting">
            <div className="people-header">
              <p>Contributor</p>
              <p>5</p>
              <i className="fa-solid fa-angle-up"></i>
              <i className="fa-solid fa-angle-down"></i>
            </div>
            <div className="people-list">
              <div className="people py-3 flex items-center text-white ">
                <div className="people-avatar">
                  <h2>A</h2>
                </div>
                <p className='text-white font-medium ml-4 mr-16'>Ananta Chandra Das</p>
                <div className="three-dots flex items-center justify-center">
                <i className="fa-solid fa-ellipsis-vertical"> </i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    )}
    </>
  )
}
