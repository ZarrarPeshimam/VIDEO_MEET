import React, { useState, useEffect } from 'react'
import "../styles/FeedbackPage.css";

export default function FeedbackPage() {
  const initialTime = 30;
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);
  
  // Calculate progress percentage for the conic-gradient
  const progressPercentage = (timeLeft / initialTime) * 100;
  const progress = `${progressPercentage}%`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <div className="running-time pt-4 ml-8 flex justify-start items-center gap-2">
        <div 
          className="timer-circle"
          style={{ "--progress": progress } as React.CSSProperties}
        >
          <span className="timer-content">{timeLeft}</span>
        </div>
        <h2 className='text-lg'>Returning to home screen</h2>
      </div>
      <div className="main-content-box flex flex-col justify-center items-center gap-4">
        <h2 className='text-4xl  mt-20 mb-8'>You left the meeting</h2>
        <div className="button-div flex justify-center items-center gap-4">
          <button className="button-rejoin">Rejoin</button>
          <button className="button-return">Return to home screen</button>
        </div>
          <h2 className='text-blue-800 font-medium cursor-pointer'>Submit feedback</h2>
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
    </div>
  )
}
