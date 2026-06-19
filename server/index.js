import { promises as dns } from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import patientRoutes from './routes/patientRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { setupSockets } from './sockets/socketHandler.js';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Allow both production and local origins
const allowedOrigins = [
  'https://queue-cure-mern-git-main-prshntiwri.vercel.app',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

setupSockets(io);

// Pass io to routes via req
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors({
  origin: allowedOrigins,
}));
app.use(express.json());

app.use('/api/patients', patientRoutes);
app.use('/api/settings', settingsRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
