import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import mongoose from 'mongoose';
import { clerkMiddleware } from '@clerk/express'


const app = express();

async function connectDB() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGO_URI is not defined');
    }
    await mongoose.connect(uri);
}

await connectDB(); // Connect to MongoDB
// Middleware
app.use(cors())
app.use(express.json());
app.use(clerkMiddleware());

const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});  