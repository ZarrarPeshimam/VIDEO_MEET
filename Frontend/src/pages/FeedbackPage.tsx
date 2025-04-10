import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import "../styles/FeedbackPage.css";
import "../styles/Rating.css";

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
          // navigate('/home');
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen p-4">
      <div className="running-time pt-4 px-4 sm:px-8 flex justify-start items-center gap-2">
        <div 
          className="timer-circle"
          style={{ "--progress": progress } as React.CSSProperties}
        >
          <span className="timer-content">{timeLeft}</span>
        </div>
        <h2
          onClick={()=> navigate('/home')}
          className='text-lg cursor-pointer hover:underline'>
          Returning to home screen
        </h2>
      </div>
      <div className="main-content-box flex flex-col justify-center items-center gap-4 max-w-5xl mx-auto py-8 px-4">
        <h2 className='text-2xl sm:text-3xl md:text-4xl font-medium mt-8 sm:mt-12 md:mt-16 mb-6 text-center'>You left the meeting</h2>
        <div className="button-div flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
          <button className="button-rejoin w-full sm:w-auto px-8 py-3">Rejoin</button>
          <button className="button-return w-full sm:w-auto px-8 py-3">Return to home screen</button>
        </div>
        <h2
          onClick={() => setShowFeedback(true)}
          className='text-blue-800 font-medium cursor-pointer mt-4 hover:underline'>
          Submit feedback
        </h2>
        <div className="security-info-div w-full sm:w-3/4 md:w-2/3 lg:w-1/2 border-2 border-gray-300 rounded-md p-4 mt-6">
          <div className="security flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="security-logo text-4xl sm:text-5xl md:text-6xl text-gray-700">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div className="security-info flex-1">
              <h2 className='text-lg font-medium mb-2'>Your meeting is safe</h2>
              <p className='text-sm md:text-base'>No one can join a meeting unless invited or admitted by the host</p>
            </div>
          </div>
          <p className='text-end text-blue-600 cursor-pointer mt-3 font-medium hover:underline'>learn more</p>
        </div>   
      </div>
      <div 
        style={{ display: showFeedback ? "flex" : "none" }}
        className="feedback-container fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 relative">
          <h2 
            onClick={() => setShowFeedback(false)}
            className='skip-button absolute right-0 top-0 pr-6 pt-4 cursor-pointer hover:text-blue-600'>
            <i className="fa-solid fa-forward"></i> Skip
          </h2>
          <div className="rating-div flex flex-col justify-center items-center gap-6 py-4">
            <h2 className='text-xl sm:text-2xl font-medium mb-2'>How was your experience?</h2>
            <fieldset className="starability-fade">
              <input type="radio" id="second-rate1" name="rating" value="1" />
              <label htmlFor="second-rate1" title="Terrible">1 star</label>
              <input type="radio" id="second-rate2" name="rating" value="2" />
              <label htmlFor="second-rate2" title="Not good">2 stars</label>
              <input type="radio" id="second-rate3" name="rating" value="3" />
              <label htmlFor="second-rate3" title="Average">3 stars</label>
              <input type="radio" id="second-rate4" name="rating" value="4" />
              <label htmlFor="second-rate4" title="Very good">4 stars</label>
              <input type="radio" id="second-rate5" name="rating" value="5" />
              <label htmlFor="second-rate5" title="Amazing">5 stars</label>
            </fieldset>
            <textarea
              className='w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              placeholder='Write your feedback here...'
            ></textarea>
            <button className="submit-feedback-button w-full py-3 mt-2">Submit</button>
          </div>
        </div>
      </div>
    </div>
  )
}
