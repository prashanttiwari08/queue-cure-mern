import Patient from '../models/Patient.js';

export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: 1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addPatient = async (req, res) => {
  const { name, mobile, age } = req.body;
  try {
    // Generate token number (incremental based on today's patients or just total patients)
    // For simplicity, we'll just get the count of total patients and add 1.
    // In production, you might want to reset this daily.
    
    // Get start of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await Patient.countDocuments({ createdAt: { $gte: startOfDay } });
    const tokenNumber = count + 1;

    const patient = new Patient({
      name,
      mobile,
      age,
      tokenNumber,
      status: 'Waiting',
    });

    const savedPatient = await patient.save();

    // Broadcast is handled in socket handler, but we can also emit from req.io if attached
    if (req.io) {
      req.io.emit('PATIENT_ADDED', savedPatient);
    }

    res.status(201).json(savedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePatientStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const patient = await Patient.findById(id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    patient.status = status;
    const updatedPatient = await patient.save();

    if (req.io) {
      if (status === 'In Consultation') {
        req.io.emit('TOKEN_CALLED', updatedPatient);
      } else if (status === 'Completed') {
        req.io.emit('PATIENT_COMPLETED', updatedPatient);
      }
    }

    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const resetQueue = async (req, res) => {
  try {
    await Patient.deleteMany({});
    if (req.io) {
      req.io.emit('QUEUE_RESET');
    }
    res.json({ message: 'Queue reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
