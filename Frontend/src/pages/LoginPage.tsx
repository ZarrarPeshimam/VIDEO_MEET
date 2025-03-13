import { useState, useContext, useEffect } from "react";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../contexts/userContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useContext(UserContext);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Check for redirect path on component mount
  useEffect(() => {
    const savedRedirectPath = localStorage.getItem('redirectAfterLogin');
    
    // Get redirect path from state (if navigated from protected route)
    const stateRedirectPath = location.state?.from;
    
    // Use path from state or localStorage
    if (stateRedirectPath) {
      setRedirectPath(stateRedirectPath);
    } else if (savedRedirectPath) {
      setRedirectPath(savedRedirectPath);
    }
  }, [location]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit =async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try{
        if(!email || !password){
            setError("Please fill in all fields.");
            return;
        }
        if (!validateEmail(email)) {
            setError("Invalid email format.");
            return;
        }
        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/login`, {email, password});
        console.log(response.data);
        if(response.status === 201){
            console.log("User logged in successfully");
            // localStorage.setItem("user", JSON.stringify(response.data));
            if(response.data.token){
                localStorage.setItem("token", response.data.token);
                
                // Store user data for offline access
                const userData = {
                  id: response.data.data._id || response.data.data.id,
                  name: response.data.data.name,
                  email: response.data.data.email,
                  token: response.data.token
                };
                localStorage.setItem("userData", JSON.stringify(userData));
            }
            setUser(response.data);
            if(rememberMe){
                localStorage.setItem("rememberMe", "true");
            }else{
                localStorage.removeItem("rememberMe");
            }
            
            // Clear the redirectAfterLogin from localStorage after using it
            if (redirectPath) {
                localStorage.removeItem('redirectAfterLogin');
                navigate(redirectPath);
            } else {
                navigate('/home');
            }
        }
    }catch(err: any){
      console.log(err);
      // Display the error message from the API response
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("An error occurred during login. Please try again.");
      }
      // Don't clear email/password on error so user can fix and retry
      return;
    }
    setEmail("");
    setPassword("");
  };

  // Show a message if the user was redirected from a meeting
  const wasMeetingRedirected = redirectPath && redirectPath.includes('meeting');

  return (
    <div className="flex items-center justify-center min-h-screen bg-[url('/background.png')] bg-cover text-white">
        <div className="w-full max-w-md p-8 rounded-lg bg-transparent border-2 border-white shadow-cyan-500 shadow-lg ">
            <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
            
            {/* Add message when redirected from meeting */}
            {wasMeetingRedirected && (
              <div className="bg-blue-900/70 p-3 rounded-md mb-4 text-center">
                You need to be logged in to join a meeting. Please login to continue.
              </div>
            )}
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 mt-1 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 mt-1 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={() => setRememberMe(!rememberMe)}
                            className="rounded text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm">Remember Me</span>
                    </label>
                    <a href="#" className="text-sm text-blue-400 hover:underline">Forgot Password?</a>
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
                >
                    Login
                </button>
            </form>
            <div className="flex items-center my-4">
                <hr className="flex-grow border-gray-600" />
                <span className="px-2 text-gray-400">OR</span>
                <hr className="flex-grow border-gray-600" />
            </div>
            <div className="flex space-x-4">
                <button className="w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white py-2 rounded transition">
                    <FaGoogle className="mr-2" /> Google
                </button>
                <button className="w-full flex items-center justify-center bg-blue-700 hover:bg-blue-800 text-white py-2 rounded transition">
                    <FaFacebook className="mr-2" /> Facebook
                </button>
            </div>
            <p className="text-sm mt-4 text-center">
                Don't have an account?{" "}
                <a href="/register" className="text-blue-400 hover:underline">Register</a>
            </p>
        </div>
    </div>
);
}
