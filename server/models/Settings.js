import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  averageConsultationTime: {
    type: Number,
    required: true,
    default: 10,
  },
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
