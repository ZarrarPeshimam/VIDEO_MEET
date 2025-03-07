import userServices from '../services/userServices.js';
import userModel from '../models/userModel.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import blackListTokenModel from '../models/blackListTokenModel.js';
import dotenv from 'dotenv';
dotenv.config();

const registerUser = async (req, res)=>{
    try{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ 
                success: false,
                errors: errors.array()
            });
        }
        const { name, email, password } = req.body;
        console.log(req.body);
        if(!name || !email || !password){
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        const isUserAlreadyExists = await userModel.findOne({ email });
        if(isUserAlreadyExists){
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        const user = await userServices.createUser({ name, email, password });
        const token = jwt.sign({
            id: user._id,
            email: user.email
        }, process.env.JWT_SECRET,
        {
            expiresIn: '2h'
        });
        console.log(process.env.JWT_SECRET);
        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                name: user.name,
                email: user.email,
                token: token
            }
        });
    }catch(err){
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const loginUser = async (req, res)=>{
    try{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({
                succes:false,
                errors: errors.array()
            })
        }
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        const user = await userModel.findOne({ email });
        if(!user){
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        const token = jwt.sign({
            id: user._id,
            email: user.email
        }, process.env.JWT_SECRET,
        {
            expiresIn: '2h'
        });
        return res.status(201).json({
            success: true,
            message: 'User logged in successfully',
            data: {
                name: user.name,
                email: user.email,
                token: token
            }
        });
    }catch(err){
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getUserProfile = async(req,res)=>{
    try{
        res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            data: req.user
        });

    }catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: 'Error in fetching user profile'
        });
    }
};

const logoutUser = async(req,res)=>{
    try{
        res.clearCookie('token');
        
        const token = req.cookies.token || 
                     (req.headers.authorization && req.headers.authorization.split(' ')[1]);
        
        if(!token) {
            return res.status(400).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        await blackListTokenModel.create({ token });
        
        return res.status(200).json({
            success: true,
            message: 'User logged out successfully'
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export default { registerUser, loginUser, getUserProfile, logoutUser };
