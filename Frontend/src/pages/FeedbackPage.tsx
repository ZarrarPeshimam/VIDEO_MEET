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
      className="feedback-container absolute h-92 w-3/7 bg-background border-1 border-emerald-600 top-2/5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-lg flex flex-col justify-center items-center gap-4">
        <div className="rating-div flex flex-col justify-center items-center gap-4 p-4 rounded-lg">
          <h2 
          onClick={() => setShowFeedback(false)}
          className='skip-button absolute right-0 top-0 pr-6 pt-4 cursor-pointer'><i className="fa-solid fa-forward"></i> Skip</h2>
          <h2 className=' text-2xl font-medium mb-4'>How was your experience ?</h2>
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
            className='w-86 h-24 p-2 border-1 border-gray-300 rounded-md'
            placeholder='Write your feedback here...'
          ></textarea>
          <button className="submit-feedback-button">Submit</button>
        </div>
      </div>
    </div>
  )
}
