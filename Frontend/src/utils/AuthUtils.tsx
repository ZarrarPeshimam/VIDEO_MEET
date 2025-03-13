import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../contexts/userContext';
import axios from 'axios';

export const useAuthCheck = () => {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Already have user data in context
        if (user && user.name) {
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
        
        // No token found
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        // Try to get user data using the token - use /profile instead of /me
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/users/profile`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          
          // The user data is in response.data.data, not response.data.user
          if (response.data && response.data.success && response.data.data) {
            const userData = response.data.data;
            // Store user data in context
            setUser({
              id: userData._id || userData.id,
              name: userData.name,
              email: userData.email,
              token: token
            });
            setIsAuthenticated(true);
          } else {
            console.warn("Auth response missing user data:", response.data);
            // Try to use any stored user data if available
            const storedUserData = localStorage.getItem('userData');
            if (storedUserData) {
              try {
                const userData = JSON.parse(storedUserData);
                setUser(userData);
                setIsAuthenticated(true);
              } catch (e) {
                console.error("Error parsing stored user data:", e);
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                setIsAuthenticated(false);
              }
            } else {
              localStorage.removeItem('token');
              setIsAuthenticated(false);
            }
          }
        } catch (error) {
          console.error("Failed to verify authentication:", error);
          // Try to use any stored user data if available
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData);
              setUser(userData);
              setIsAuthenticated(true);
            } catch (e) {
              localStorage.removeItem('token');
              localStorage.removeItem('userData');
              setIsAuthenticated(false);
            }
          } else {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [setUser, user]);

  return { isAuthenticated, loading, user };
};

export const getUserName = () => {
  // Simpler function to just get username from localStorage if available
  const userData = localStorage.getItem('userData');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user.name;
    } catch (e) {
      return null;
    }
  }
  return null;
};
