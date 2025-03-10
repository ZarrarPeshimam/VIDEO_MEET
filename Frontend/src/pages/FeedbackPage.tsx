import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import "../styles/FeedbackPage.css";

export default function FeedbackPage() {
  const navigate = useNavigate();
  const initialTime = 30;
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Calculate progress percentage for the conic-gradient
  const progressPercentage = (timeLeft / initialTime) * 100;
  const progress = `${progressPercentage}%`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // Redirect to home page when timer completes
          navigate('/home');
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div>
      <div className="running-time pt-4 ml-8 flex justify-start items-center gap-2">
        <div 
          className="timer-circle"
          style={{ "--progress": progress } as React.CSSProperties}
        >
          <span className="timer-content">{timeLeft}</span>
        </div>
        <h2
        onClick={()=> navigate('/home')}
         className='text-lg'>Returning to home screen</h2>
      </div>
      <div className="main-content-box flex flex-col justify-center items-center gap-4">
        <h2 className='text-4xl  mt-20 mb-8'>You left the meeting</h2>
        <div className="button-div flex justify-center items-center gap-4">
          <button className="button-rejoin">Rejoin</button>
          <button className="button-return">Return to home screen</button>
        </div>
          <h2
          onClick={() => setShowFeedback(true)}
          className='text-blue-800 font-medium cursor-pointer'>Submit feedback</h2>
          <div className="security-info-div w-1/4 border-2 border-gray-300 rounded-sm p-3 mt-4">
            <div className="security flex justify-between items-center gap-8">
            <div className="security-logo text-6xl">
            <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div className="security-info">
            <h2 className='text-lg font-medium'>Your meeting is safe</h2>
            <p className=''>No one can join a meeting unless invited or admitted by the host</p>
            </div>
            </div>
            <p className='text-end text-blue-600 cursor-pointer mt-2 font-medium'>learn more</p>
          </div>   
      </div>
      <div 
      style={{ display: showFeedback ? "block" : "none" }}
      className="feedback-container absolute h-96 w-4/7 bg-background border-1 border-emerald-600 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-lg flex flex-col justify-center items-center gap-4">

      </div>
    </div>
  )
}
