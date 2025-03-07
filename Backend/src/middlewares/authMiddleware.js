import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import blackListTokenModel from '../models/blackListTokenModel.js';



const authenticateUser = async(req, res, next)=>{
    try{
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if(!token){
            return res.status(401).json({
                success: false,
                message: 'Unauthorized user'
            });
        }
        const isBlackListed = await blackListTokenModel.findOne({ token });
        if(isBlackListed){
            return res.status(401).json({
                success: false,
                message: 'Unauthorized user'
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);
        if(!user){
            return res.status(401).json({
                success: false,
                message: 'Unauthorized user'
            });
        }
        req.user = user;
        next();
    }catch(err){
        console.error(err);
        return res.status(401).json({
            success: false,
            message: 'Unauthorized user'
        })
    }
};

export default { authenticateUser };