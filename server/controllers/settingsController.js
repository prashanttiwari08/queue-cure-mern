import Settings from '../models/Settings.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ averageConsultationTime: 10 });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  const { averageConsultationTime } = req.body;
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ averageConsultationTime });
    } else {
      settings.averageConsultationTime = averageConsultationTime;
    }
    const updatedSettings = await settings.save();

    if (req.io) {
      req.io.emit('SET_AVG_TIME', updatedSettings.averageConsultationTime);
    }

    res.json(updatedSettings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
