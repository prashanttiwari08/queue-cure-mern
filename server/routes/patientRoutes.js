import express from 'express';
import { getPatients, addPatient, updatePatientStatus, resetQueue } from '../controllers/patientController.js';

const router = express.Router();

router.get('/', getPatients);
router.post('/', addPatient);
router.put('/:id/status', updatePatientStatus);
router.delete('/reset', resetQueue);

export default router;
