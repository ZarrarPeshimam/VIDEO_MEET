import React from 'react'
import axios from 'axios'
import { useContext } from 'react'
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
  

export default function HomePage() {
    const navigate = useNavigate();
    const {user, setUser} = useContext(UserContext);
    const [api, setApi] = React.useState<CarouselApi>()
    const [current, setCurrent] = React.useState(0)
    const [count, setCount] = React.useState(0)
   
    React.useEffect(() => {
      if (!api) {
        return
      }
   
      setCount(api.scrollSnapList().length)
      setCurrent(api.selectedScrollSnap() + 1)
   
      api.on("select", () => {
        setCurrent(api.selectedScrollSnap() + 1)
      })
    }, [api])


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



  return (
    <div>
        <div className="nav-bar">
            <div className="nav-bar-left-content">
                <h2 className='cursor-pointer text-xl font-medium'>VideoMeet</h2>
            </div>
            <div className="nav-bar-right-content text-lg">
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
                <i className="fa-solid fa-clock-rotate-left"></i>
                <div className="profile-picture"></div>
            </div>

        </div>
        <div className="main-containt">
            <div className="left-side-content">
                <h2 className='heading font-bold text-4xl'>Premium video meetings </h2>
                <h2 className='heading font-bold text-4xl'>Now free for everyone</h2>
                <p className='heading-small mt-8 '>We re-engineered the service we built for secure business meetings,</p>
                <p className='heading-small '> Google Meet, to make it free and available for all.</p>
                <div className="start-call-field">
                    <button className='Start-call-button'>
                        <h2><i className="fa-solid fa-square-plus"></i></h2>
                        New meeting
                        </button>
                    <div className="input-link">
                    <i className="fa-solid fa-keyboard"></i>
                    <input type="text" placeholder="Enter a code or link" className='outline-none'></input>
                    </div>
                </div>
                <p className='hr-line border-b-1 border-black w-10/12 mt-10'></p>
                <p className='mt-8 text-lg'><span className='text-blue-500 cursor-pointer hover:text-blue-600'>Learn more </span>about Video Meet</p>
            </div>
            <div className="right-side-content w-80 ml-56 mt-28">
                <Carousel className='carousel '>
                <CarouselContent className='carousel-content flex justify-between items-center'>
                    <CarouselItem><div className='h-80 w-80 bg-amber-300 border-2 border-amber-700 rounded-full'></div></CarouselItem>
                    <CarouselItem><div className='h-80 w-80 bg-red-700 border-2 border-amber-700 rounded-full'></div></CarouselItem>
                    <CarouselItem><div className='h-80 w-80 bg-blue-700 border-2 border-amber-700 rounded-full'></div></CarouselItem>
                    <CarouselItem><div className='h-80 w-80 bg-card border-2 border-amber-700 rounded-full'></div></CarouselItem>
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
    // <div>
    //   Well come to Home Page
    //   <button
    //   onClick={handleLogout}
    //    className=' border border-amber-500 p-2 rounded-2xl'>Logout</button>
    // </div>
  )
}
