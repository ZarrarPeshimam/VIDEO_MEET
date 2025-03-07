import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import {createServer} from 'http';
import connectToSocket from './src/controllers/socketManager.js';
import cors from 'cors';
import connectDb from './src/Db/Db.js';
import userRoutes from './src/routes/userRoutes.js';
import cookieParser from 'cookie-parser';

const app = express();
const port = process.env.PORT;

const server = createServer(app);
const io = connectToSocket(server);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
connectDb();

app.use('/users', userRoutes);

app.get('/', (req, res) => {
    res.send("Server is running");
});

// Remove the app.listen and use server.listen instead
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
