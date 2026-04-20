const express = require('express');
const cors = require('cors');
require('dotenv').config();

const listsRouter  = require('./routes/lists');
const moviesRouter = require('./routes/movies');

const app = express();

app.use(cors());
app.use(express.json());
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/lists',  listsRouter);
app.use('/api/movies', moviesRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

const tmdbRouter = require('./routes/tmdb');
app.use('/api/tmdb', tmdbRouter);