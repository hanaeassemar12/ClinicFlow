const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { randomUUID } = require('crypto');

// 1. CRÉER un patient (POST /api/patients)
router.post('/', verifyToken, async (req, res) => {
  const { fullName, fullname, cin, phone, birthDate, birthdate, address } = req.body;
  const finalFullName = fullName || fullname;
  const finalBirthDate = birthDate || birthdate;

  try {
    // Vérifier si le CIN existe déjà
    const existingPatient = await pool.query('SELECT * FROM patients WHERE cin = $1', [cin]);
    if (existingPatient.rows.length > 0) {
      return res.status(400).json({ error: 'Un patient avec ce CIN existe déjà.' });
    }

    const id = randomUUID();
    const newPatient = await pool.query(
      `INSERT INTO patients (id, fullname, cin, phone, birthdate, address, createdat) 
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING *`,
      [id, finalFullName, cin, phone, finalBirthDate, address]
    );

    res.status(201).json({
      message: 'Patient créé avec succès',
      patient: newPatient.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du patient.' });
  }
});

// 2. LISTER les patients avec recherche et pagination (GET /api/patients)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM patients';
    let countQuery = 'SELECT COUNT(*) FROM patients';
    let queryParams = [];

    if (search) {
      query += ' WHERE fullname ILIKE $1 OR cin ILIKE $1';
      countQuery += ' WHERE fullname ILIKE $1 OR cin ILIKE $1';
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY createdat DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const patients = await pool.query(query, queryParams);
    const totalCount = await pool.query(countQuery, search ? [`%${search}%`] : []);

    res.json({
      total: parseInt(totalCount.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      patients: patients.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des patients.' });
  }
});

// 3. RÉCUPÉRER un patient par son ID (GET /api/patients/:id)
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const patient = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    if (patient.rows.length === 0) {
      return res.status(404).json({ error: 'Patient introuvable.' });
    }

    const appointments = await pool.query('SELECT * FROM appointments WHERE patientId = $1 ORDER BY appointmentDate DESC', [id]);

    res.json({
      patient: patient.rows[0],
      appointments: appointments.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// 4. MODIFIER un patient (PUT /api/patients/:id)
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { fullName, fullname, cin, phone, birthDate, birthdate, address } = req.body;
  const finalFullName = fullName || fullname;
  const finalBirthDate = birthDate || birthdate;

  try {
    const updatedPatient = await pool.query(
      `UPDATE patients 
       SET fullname = $1, cin = $2, phone = $3, birthdate = $4, address = $5 
       WHERE id = $6 RETURNING *`,
      [finalFullName, cin, phone, finalBirthDate, address, id]
    );

    if (updatedPatient.rows.length === 0) {
      return res.status(404).json({ error: 'Patient introuvable.' });
    }

    res.json({
      message: 'Patient mis à jour avec succès',
      patient: updatedPatient.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
});

// 5. SUPPRIMER un patient - ADMIN ONLY (DELETE /api/patients/:id)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const deletedPatient = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING *', [id]);
    if (deletedPatient.rows.length === 0) {
      return res.status(404).json({ error: 'Patient introuvable.' });
    }
    res.json({ message: 'Patient supprimé avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

module.exports = router;