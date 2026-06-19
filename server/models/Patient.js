import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
  },
  tokenNumber: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Waiting', 'In Consultation', 'Completed'],
    default: 'Waiting',
  },
}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;
