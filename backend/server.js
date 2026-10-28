const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

// Importer les routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Utiliser les routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);

const PORT = process.env.PORT || 5000;

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l API ClinicFlow de Tython !' });
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});