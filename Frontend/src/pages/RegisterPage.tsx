import { useState, useContext } from "react";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 
import { UserContext } from "../contexts/userContext";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { setUser } = useContext(UserContext);

  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try{
      if(!name || !email || !password){
        setError("Please fill in all fields.");
        return;
      }
      if (!validateEmail(email)) {
        setError("Invalid email format.");
        return;
      }
      const newUser = {
        name,
        email,
        password
      }
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/register`, newUser);
      if(response.status === 201){
        console.log("User registered successfully");
        if(response.data.token){
          localStorage.setItem("token", response.data.token);
        }
        setUser(response.data);
        if(rememberMe){
          localStorage.setItem("rememberMe", "true");
        }else{
            localStorage.removeItem("rememberMe");
        }
        navigate('/home');
      }
    }catch(err){
      console.log(err);
    }
    setName("");
    setEmail("");
    setPassword("");
  };

return (
    <div className="flex items-center justify-center min-h-screen bg-[url('/background.png')] bg-cover text-white">
      <div className="w-full max-w-md p-8  rounded-lg shadow-cyan-500 shadow-lg bg-transparent border-2 border-white">
        <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 mt-1 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
            Register
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
          Already have an account?{" "}
          <a href="/login" className="text-blue-400 hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
}
