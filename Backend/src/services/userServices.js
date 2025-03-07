import userModel from '../models/userModel.js';
import bcrypt from 'bcrypt';

const createUser = async ({
    name,
    email,
    password
})=>{
    try{
        if(!name || !email || !password){
            throw new Error('Missing required fields');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userModel({
            name,
            email,
            password: hashedPassword
        })
        await user.save();
        return user;
    }catch(err){
        console.error(err);
        throw new Error('Error in creating user');
    }
};

export default { createUser };