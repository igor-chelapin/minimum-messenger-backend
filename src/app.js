const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Загружаем переменные окружения
dotenv.config();

// Инициализация Express
const app = express();

// Middleware
app.use(cors()); // Разрешаем кросс-доменные запросы
app.use(express.json()); // Парсим JSON тела запросов

// Подключение к MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/minimum');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Создаем HTTP сервер
const server = http.createServer(app);

// Инициализация Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*", // В разработке можно "*", в продакшене заменить на домен фронтенда
    methods: ["GET", "POST"]
  }
});

// Health check маршрут
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Minimum Messenger API'
  });
});

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Minimum Messenger API' });
});

// Обработка socket.io подключений
io.on('connection', (socket) => {
  console.log('🔵 User connected:', socket.id);
  
  // Приветственное сообщение
  socket.emit('welcome', { 
    message: 'Welcome to Minimum Messenger!',
    yourId: socket.id 
  });
  
  // Обработка отключения
  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
  
  // Тестовое событие ping-pong
  socket.on('ping', (data) => {
    console.log('📩 Ping received:', data);
    socket.emit('pong', { 
      message: 'pong', 
      timestamp: Date.now(),
      received: data 
    });
  });
});

// Порт из .env или 3000 по умолчанию
const PORT = process.env.PORT || 3000;

// Запуск сервера
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  });
});

// Обработка ошибок
process.on('unhandledRejection', (err) => {
  console.log('❌ Unhandled Rejection:', err);
  process.exit(1);
});