require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const cardRoutes = require('./routes/cardRoutes');
const taskRoutes = require('./routes/taskRoutes');
const repositoryRoutes = require('./routes/repositoryRoutes');


app.use(cors());

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/auth', authRoutes);
app.use('/boards', boardRoutes);
app.use('/boards/:boardId/cards', cardRoutes);
app.use('/boards/:boardId/cards/:id/tasks', taskRoutes);
app.use('/repositories', repositoryRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

app.listen(3000, () => console.log('Server running on port 3000'));