import { useState, useRef, useEffect } from 'react'
import '../styles/VideoMeetingPage.css'
// Add import for video layout manager
import { updateVideoLayout, markAsScreenShare, updateLocalVideoPosition } from "../scripts/videoLayoutManager";

import { IconButton, Button, TextField } from "@mui/material";
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
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

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
  
  // Add missing refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<any>(null);
  const socketIdRef = useRef<string>("");
  const navigate = useNavigate();
  
  // Create connections object
  const connections: ConnectionsType = {};

  // Add a ref for the chat display container
  const chatDisplayRef = useRef<HTMLDivElement>(null);

  // Add ref for remote video container
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null);
  const localVideoContainerRef = useRef<HTMLDivElement>(null);

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

  const getPermissions = async () => {
    try {
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
    } catch (err) {
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setVideoAvailable(false);
        setAudioAvailable(false);
      }
      console.log(err);
    }
  };

  useEffect(() => {
    getPermissions();
    return () => {
      Object.values(connections).forEach((connection) => connection.close());
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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

  const connectToSocketServer = () => {
    console.log("Connecting to socket server:", server_url);
    socketRef.current = io(server_url, { secure: true });

    socketRef.current.on("signal", (fromId: string, message: string) => {
      console.log("Signal received from:", fromId);
      gotMessageFromServer(fromId, message);
    });

    socketRef.current.on("connect", () => {
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
        if (clientId !== socketRef.current.id && !connections[clientId]) {
        console.log("Creating new connection for:", clientId);
        
        // Create new RTCPeerConnection
        connections[clientId] = new RTCPeerConnection(peerConfigConnection);

        // Handle ICE candidates
        connections[clientId].onicecandidate = (event) => {
          if (event.candidate) {
          console.log("Sending ICE candidate to:", clientId);
          socketRef.current.emit(
            "signal",
            clientId,
            JSON.stringify({
            ice: event.candidate,
            })
          );
          }
        };

        // Handle remote stream
        connections[clientId].onaddstream = (event) => {
          console.log("Received stream from:", clientId, event.stream);
          
          setVideos((prevVideos) => {
          // Check if we already have this user's video
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

        // Add local stream to connection if available
        if (window.localStream) {
          console.log("Adding local stream to connection:", clientId);
          connections[clientId].addStream(window.localStream);
        } else {
          console.warn("Local stream not available for:", clientId);
        }
        }
      });

      // If we're the new user, initiate offers to all existing users
      if (userId === socketRef.current.id) {
        console.log("I'm the new user, initiating connections");
        clients.forEach((clientId) => {
        if (clientId === socketRef.current.id) return;
        
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
            .catch((e) =>
            console.error("Error setting local description:", e)
            );
          })
          .catch((e) => console.error("Error creating offer:", e));
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

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    getUserMedia();  // Make sure to call getUserMedia here
    connectToSocketServer();
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
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  const handleEndCall = () => {
    try {
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    } catch(err) {
      console.error("Error: ", err);
    }
    navigate("/home");
  };

  return (
    <>
    {
      askForUsername ? (
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
      )
    }

    </>
  )
}
