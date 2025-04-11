import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import "../styles/StartPage.css";

export default function StartPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    if (mobileMenuOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
          setMobileMenuOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mobileMenuOpen]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <div className="landingPageContainer min-h-screen flex flex-col">
        {/* Navigation Bar */}
        <nav className="navbar py-3 px-4 sm:px-6 flex justify-between items-center relative">
            <div className="navLogo">
              <h2 className="text-2xl font-bold tracking-wide"> 
                <span className="text-yellow-400">Aura</span>Meet 
              </h2>
            </div>
            
            {/* Desktop Navigation - FIXED */}
            <div className="navLink items-center gap-5 md:flex hidden">
                <p className="nav-item cursor-pointer hover:text-yellow-200">Join as a guest</p>
                <p 
                  className="nav-item cursor-pointer hover:text-yellow-200"
                  onClick={() => navigate("/register")}
                >
                  Register
                </p>
                <button
                  className="nav-button px-6 rounded-md transition hover:shadow-lg" // Removed py-2 as it's now in CSS
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>
            </div>
            
            {/* Mobile Navigation Button */}
            <div className="block md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="mobile-menu-button p-2 rounded-md focus:outline-none"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <i className="fa-solid fa-xmark text-xl"></i>
                ) : (
                  <i className="fa-solid fa-bars text-xl"></i>
                )}
              </button>
            </div>
        </nav>
        
        {/* Mobile menu backdrop */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 md:hidden menu-backdrop"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu md:hidden">
            <p className="py-3 border-b border-gray-700 cursor-pointer">Join as a guest</p>
            <p 
              className="py-3 border-b border-gray-700 cursor-pointer"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/register");
              }}
            >
              Register
            </p>
            <button
              className="mt-2 py-3 px-6 rounded-md w-full font-medium"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/login");
              }}
            >
              Login
            </button>
          </div>
        )}
        
        {/* Main Content */}
        <div className="landingPageMainContent flex-1 flex flex-col md:flex-row items-center">
            <div className='leftContent w-full md:w-1/2 text-center md:text-left'>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6 heading-text">
                    <span className="nowrap large-screen-first-line">
                        <span className="highlight text-yellow-400">Connect</span> with your loved
                    </span> ones...
                </h2>
                <p className="text-base sm:text-lg mb-8 max-w-md mx-auto md:mx-0 opacity-90">
                    From ghar ki hasi to dil ki baat, connect with loved ones no matter the distance
                </p>
                <button
                  className="px-6 rounded-md text-lg transition-all duration-200 transform hover:scale-105 hover:shadow-md" // Reduced duration from 300 to 200, reduced shadow from lg to md
                  onClick={() => {
                    navigate("/register");
                  }}
                >
                  Get Started
                </button>
            </div>
            <div className="rightContent w-full md:w-1/2 mt-10 md:mt-0 flex justify-center items-center">
              <div className="illustration-container w-full max-w-md h-64 sm:h-80 md:h-96 rounded-lg flex items-center justify-center">
                <img 
                  src="/video.svg" 
                  alt="Video conference illustration" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
        </div>
      </div>
    </>
  )
}
