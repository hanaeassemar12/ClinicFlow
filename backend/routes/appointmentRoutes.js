const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// 1. CRÉER un rendez-vous avec vérification de la règle des 30 minutes (POST /api/appointments)
router.post('/', verifyToken, async (routerReq, routerRes) => {
  const { patientId, appointmentDate, status = 'pending', reason, notes } = routerReq.body;
  const createdBy = routerReq.user.id; 

  try {
    // Vérifier si le patient existe
    const patientExists = await pool.query('SELECT * FROM patients WHERE id = $1', [patientId]);
    if (patientExists.rows.length === 0) {
      return routerRes.status(404).json({ error: 'Patient introuvable.' });
    }

    // Règle métier : Si le statut est 'confirmed', vérifier qu'il n'y a pas un autre RDV confirmé dans une fenêtre de 30 min
    if (status === 'confirmed') {
      const thirtyMins = 30 * 60 * 1000; // 30 minutes en millisecondes
      const newDate = new Date(appointmentDate);
      const startTime = new Date(newDate.getTime() - thirtyMins).toISOString();
      const endTime = new Date(newDate.getTime() + thirtyMins).toISOString();

      const overlappingQuery = `
        SELECT * FROM appointments 
        WHERE patientId = $1 
          AND status = 'confirmed' 
          AND appointmentDate BETWEEN $2 AND $3
      `;
      const overlapping = await pool.query(overlappingQuery, [patientId, startTime, endTime]);

      if (overlapping.rows.length > 0) {
        return routerRes.status(400).json({ 
          error: 'Conflit de rendez-vous : Ce patient a déjà un rendez-vous confirmé dans un intervalle de 30 minutes.' 
        });
      }
    }

    // Insérer le rendez-vous
    const newAppointment = await pool.query(
      `INSERT INTO appointments (patientId, appointmentDate, status, reason, notes, createdBy) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patientId, appointmentDate, status, reason, notes, createdBy]
    );

    routerRes.status(201).json({
      message: 'Rendez-vous créé avec succès',
      appointment: newAppointment.rows[0]
    });
  } catch (err) {
    console.error(err);
    routerRes.status(500).json({ error: 'Erreur serveur lors de la création du rendez-vous.' });
  }
});

// 2. LISTER les rendez-vous avec filtres par date et statut (GET /api/appointments)
router.get('/', verifyToken, async (routerReq, routerRes) => {
  try {
    const { date, status } = routerReq.query;
    let query = `
      SELECT a.*, p.fullName as patientName, p.cin as patientCin, u.email as createdByEmail
      FROM appointments a
      JOIN patients p ON a.patientId = p.id
      JOIN users u ON a.createdBy = u.id
      WHERE 1=1
    `;
    let queryParams = [];

    if (status) {
      queryParams.push(status);
      query += ` AND a.status = $${queryParams.length}`;
    }

    if (date) {
      // Filtrer par jour spécifique (YYYY-MM-DD)
      queryParams.push(date);
      query += ` AND DATE(a.appointmentDate) = $${queryParams.length}`;
    }

    query += ' ORDER BY a.appointmentDate ASC';

    const appointments = await pool.query(query, queryParams);
    routerRes.json(appointments.rows);
  } catch (err) {
    console.error(err);
    routerRes.status(500).json({ error: 'Erreur serveur lors de la récupération des rendez-vous.' });
  }
});

// 3. MODIFIER le statut d'un rendez-vous (PATCH /api/appointments/:id/status)
router.patch('/:id/status', verifyToken, async (routerReq, routerRes) => {
  const { id } = routerReq.params;
  const { status } = routerReq.body;

  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return routerRes.status(400).json({ error: 'Statut invalide.' });
  }

  try {
    // Si on veut le confirmer, refaire la vérification des 30 minutes
    if (status === 'confirmed') {
      const currentAppt = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
      if (currentAppt.rows.length === 0) {
        return routerRes.status(404).json({ error: 'Rendez-vous introuvable.' });
      }

      const { patientid, appointmentdate } = currentAppt.rows[0];
      const thirtyMins = 30 * 60 * 1000;
      const newDate = new Date(appointmentdate);
      const startTime = new Date(newDate.getTime() - thirtyMins).toISOString();
      const endTime = new Date(newDate.getTime() + thirtyMins).toISOString();

      const overlapping = await pool.query(
        `SELECT * FROM appointments WHERE patientId = $1 AND status = 'confirmed' AND id != $2 AND appointmentDate BETWEEN $3 AND $4`,
        [patientid, id, startTime, endTime]
      );

      if (overlapping.rows.length > 0) {
        return routerRes.status(400).json({ error: 'Impossible de confirmer : Conflit de 30 minutes détecté pour ce patient.' });
      }
    }

    const updated = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (updated.rows.length === 0) {
      return routerRes.status(404).json({ error: 'Rendez-vous introuvable.' });
    }

    routerRes.json({
      message: 'Statut du rendez-vous mis à jour avec succès',
      appointment: updated.rows[0]
    });
  } catch (err) {
    console.error(err);
    routerRes.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;