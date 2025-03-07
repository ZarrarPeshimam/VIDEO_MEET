import React from 'react'
import { useNavigate } from 'react-router-dom';
import "../styles/StartPage.css";


export default function StartPage() {
  const navigate = useNavigate();
  return (
    <>
      <div className="landingPageContainer">
        <nav>
            <div className="navLogo">
            <h2> AuraMeet </h2>
            </div>
            <div className="navLink">
                <p>Join as a guest</p>
                <p
                onClick={() => {
                  navigate("/register");
                }}
                >Register</p>
                <button
                onClick={() => {
                  navigate("/login");
                }}
                >Login</button>
            </div>
        </nav>
        <div className="landingPageMainContent">
            <div className='leftContent'>
                <h2>
                    <span>Connect</span> with your <br /> loved ones...
                </h2>
                <p>From ghar ki hasi to dil ki baat, connect with loved ones no matter the distance</p>
                <button
                onClick={() => {
                  navigate("/register");
                }}
                >Get Started</button>
            </div>
            <div className="rightContent">
            </div>
        </div>
      </div>
    </>
  )
}
