import React from 'react'
import axios from 'axios'
import { useContext } from 'react'
import { UserContext } from '../contexts/userContext'
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
    const navigate = useNavigate();
    const {user, setUser} = useContext(UserContext);



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
      Well come to Home Page
      <button
      onClick={handleLogout}
       className=' border border-amber-500 p-2 rounded-2xl'>Logout</button>
    </div>
  )
}
