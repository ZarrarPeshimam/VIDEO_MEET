import React from 'react'
import axios from 'axios'
import { useContext, useState, useEffect } from 'react'
import { UserContext } from '../contexts/userContext'
import { useNavigate } from 'react-router-dom';
import "../styles/HomePage.css";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
  } from "@/components/ui/carousel"
import { useMeeting } from '@/contexts/meetingContext';
  

export default function HomePage() {
    const navigate = useNavigate();
    const {user, setUser} = useContext(UserContext);
    const [current, setCurrent] = React.useState(0)
    const [count, setCount] = React.useState(0)
    const [showProfile, setShowProfile] = useState(false)
    const [meetingCode, setMeetingCode] = useState('')
    const meeting = useMeeting();

    // Check authentication on component mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
        }
    }, [navigate]);
   
    // Add this effect after other useEffect hooks
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.profile-picture') && !target.closest('.profile-content')) {
                setShowProfile(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token') || user?.token;
            
            if (!token) {
                console.log("No token found");
                setUser(null);
                localStorage.clear();
                navigate('/');
                return;
            }
    
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/users/logout`, 
                {}, 
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
    
            if (response.status === 200) {
                console.log("User logged out successfully");
                localStorage.clear();
                setUser(null);
                navigate('/');
            }
        } catch (err) {
            console.error("Logout error:", err);
            // Still clear local data even if server request fails
            localStorage.clear();
            setUser(null);
            navigate('/');
        }
    }

    // Navigate to history page
    const navigateToHistory = (event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent this from triggering other click handlers
        navigate('/history');
    };
    
    // Create a new meeting
    const handleNewMeeting = async () => {
        try {
            // Show loading state if needed
            
            const meetingId = await meeting.createMeeting();
            
            if (!meetingId) {
                console.error("Failed to create meeting - no meeting ID returned");
                return;
            }
            
            try {
                // Add meeting to history but don't block navigation if it fails
                await meeting.addMeetingToHistory({
                    title: `Meeting ${new Date().toLocaleString()}`,
                    startTime: new Date().toISOString(),
                    endTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour default
                    meetingLink: `${window.location.origin}/meeting/${meetingId}`,
                    status: 'ongoing'
                });
            } catch (historyError) {
                console.log("Failed to add meeting to history, but continuing:", historyError);
                // Continue with navigation even if history update fails
            }
            
            // Navigate to meeting room with the correct path
            navigate(`/meeting/${meetingId}`);
        } catch (error) {
            console.error("Error creating meeting:", error);
            // Show error message to user if needed
        }
    };
    
    // Join existing meeting
    const handleJoinMeeting = () => {
        if (meetingCode) {
            // If user entered a complete URL, extract just the meeting ID
            if (meetingCode.includes('/meeting/')) {
                const meetingId = meetingCode.split('/meeting/')[1];
                navigate(`/meeting/${meetingId}`);
            } else {
                // Otherwise use the code directly
                navigate(`/meeting/${meetingCode}`);
            }
        }
    };

  return (
    <div>
        <div className="nav-bar">
            <div className="nav-bar-left-content">
                <h2 className='cursor-pointer text-xl font-medium'>VideoMeet</h2>
            </div>
            <div className="nav-bar-right-content text-lg font-normal">
                <h2>
                    {new Date().toLocaleString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    })} . {new Date().toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    })} . {new Date().toLocaleString('en-US', {
                        weekday: 'long'
                    })}
                </h2>
                <i className="fa-solid fa-gear"></i>
                <i className="fa-solid fa-clock-rotate-left cursor-pointer" onClick={navigateToHistory}></i>
                <div className="profile-picture" onClick={() => setShowProfile(!showProfile)}>
                    <h2>A</h2>
                </div>
            </div>

        </div>
        {
            showProfile && (
                <div className="profile-content h-52 w-64 border-1 font-medium border-amber-900 bg-background absolute top-16 right-25 rounded-lg z-10 flex flex-col p-2">
                <div className="manage-history flex items-center gap-4 p-2.5 text-lg cursor-pointer" onClick={navigateToHistory}>
                    <i className="fa-solid fa-clock-rotate-left"></i>
                    <h2>History</h2>
                </div>
                <div className="manage-customization flex items-center gap-4 p-2.5 text-lg cursor-pointer">
                    <i className="fa-solid fa-pencil"></i>
                    <h2>Customize profile</h2>
                </div>
                <div className="manage-another-profile flex items-center gap-4 p-2.5 text-lg cursor-pointer">
                    <i className="fa-solid fa-user-plus"></i>
                    <h2>Add another account</h2>
                </div>
    
                <div className="manage-logout flex items-center gap-4 p-2.5 text-lg cursor-pointer" onClick={handleLogout}>
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <h2>Logout</h2>
                </div>
            </div>
            )
        }

        <div className="main-containt">
            <div className="left-side-content">
                <h2 className='heading font-bold text-4xl'>Premium video meetings </h2>
                <h2 className='heading font-bold text-4xl'>Now free for everyone</h2>
                <p className='heading-small mt-8 '>We re-engineered the service we built for secure business meetings,</p>
                <p className='heading-small '> Google Meet, to make it free and available for all.</p>
                <div className="start-call-field">
                    <button className='Start-call-button' onClick={handleNewMeeting}>
                        <h2><i className="fa-solid fa-square-plus"></i></h2>
                        New meeting
                        </button>
                    <div className="input-link">
                    <i className="fa-solid fa-keyboard"></i>
                    <input 
                        type="text" 
                        placeholder="Enter a code or link" 
                        className='outline-none'
                        value={meetingCode}
                        onChange={(e) => setMeetingCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoinMeeting()}
                    />
                    </div>
                    <button 
                        className={`Join-button ${meetingCode ? 'active' : ''}`} 
                        onClick={handleJoinMeeting}
                        disabled={!meetingCode}
                    >
                        <h2>Join</h2>
                    </button>
                </div>
                <p className='hr-line border-b-1 border-black w-10/12 mt-10'></p>
                <p className='mt-8 text-lg'><span className='text-blue-500 cursor-pointer hover:text-blue-600'>Learn more </span>about Video Meet</p>
            </div>
            <div className="right-side-content w-80 ml-56 mt-28">
                <Carousel className='carousel '>
                <CarouselContent className='carousel-content flex justify-between items-center'>
                    <CarouselItem><div className='h-80 w-80 rounded-full overflow-hidden'>
                        <img src="./photo2.jpg" alt="" className="w-full h-full object-cover" />
                        </div></CarouselItem>
                    <CarouselItem><div className='h-80 w-80  rounded-full overflow-hidden'>
                        <img src="./photo1.jpg" alt="" className="w-full h-full object-cover" />
                        </div></CarouselItem>
                    <CarouselItem><div className='h-80 w-80 rounded-full overflow-hidden'>
                    <img src="./photo3.jpg" alt="" className="w-full h-full object-cover" />
                        </div></CarouselItem>
                    <CarouselItem><div className='h-80 w-80  rounded-full overflow-hidden'>
                    <img src="./photo4.jpg" alt="" className="w-full h-full object-cover" />
                        </div></CarouselItem>
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext/>
                </Carousel>
                <div className="carosel-content w-80 items-center text-center ml-2 mt-6">
                    <p>Click <span className=' font-medium text-lg'>New meeting </span>to get a link you can send to people you want to meet with</p>
                </div>
            </div>
        </div>
    </div>
  )
}
