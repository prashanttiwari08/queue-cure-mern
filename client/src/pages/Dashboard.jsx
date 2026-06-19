import React, { useState, useEffect } from 'react';
import { patientApi, settingsApi } from '../services/api';
import { socket } from '../sockets/socket';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Clock, ListChecks, Settings2, Activity, ExternalLink, RotateCcw, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [settings, setSettings] = useState({ averageConsultationTime: 10 });
  const [formData, setFormData] = useState({ name: '', mobile: '', age: '' });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [patientsRes, settingsRes] = await Promise.all([
        patientApi.getPatients(),
        settingsApi.getSettings()
      ]);
      setPatients(patientsRes.data);
      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    socket.on('PATIENT_ADDED', (newPatient) => {
      setPatients((prev) => [...prev, newPatient]);
      toast.success(`Token #${newPatient.tokenNumber} generated for ${newPatient.name}`);
    });

    socket.on('TOKEN_CALLED', (updatedPatient) => {
      setPatients((prev) => prev.map(p => p._id === updatedPatient._id ? updatedPatient : p));
      toast(`Calling Token #${updatedPatient.tokenNumber}`, { icon: '🔔' });
    });

    socket.on('PATIENT_COMPLETED', (updatedPatient) => {
      setPatients((prev) => prev.map(p => p._id === updatedPatient._id ? updatedPatient : p));
    });

    socket.on('QUEUE_RESET', () => {
      setPatients([]);
      toast.success('Queue has been reset');
    });

    socket.on('SET_AVG_TIME', (time) => {
      setSettings((prev) => ({ ...prev, averageConsultationTime: time }));
    });

    return () => {
      socket.off('PATIENT_ADDED');
      socket.off('TOKEN_CALLED');
      socket.off('PATIENT_COMPLETED');
      socket.off('QUEUE_RESET');
      socket.off('SET_AVG_TIME');
    };
  }, []);

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      await patientApi.addPatient(formData);
      setFormData({ name: '', mobile: '', age: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add patient');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await patientApi.updateStatus(id, status);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleResetQueue = async () => {
    if (window.confirm('Are you sure you want to reset the entire queue?')) {
      try {
        await patientApi.resetQueue();
      } catch (error) {
        toast.error('Failed to reset queue');
      }
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await settingsApi.updateSettings(settings.averageConsultationTime);
      toast.success('Settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const waitingPatients = patients.filter(p => p.status === 'Waiting');
  const currentPatient = patients.find(p => p.status === 'In Consultation');
  const completedPatients = patients.filter(p => p.status === 'Completed');

  /* ── Loading Skeleton ──────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-secondary flex items-center justify-center animate-bounce-gentle shadow-neon-blue">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <p className="text-slate-400 font-medium tracking-wide animate-pulse">Loading Dashboard…</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background mesh */}
      <div className="fixed inset-0 pointer-events-none opacity-60 mesh-bg" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto p-5 md:p-8 space-y-7"
      >
        {/* ── Header ──────────────────────────── */}
        <motion.header variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Reception Dashboard
              </h1>
              <p className="text-slate-400 text-sm mt-0.5 font-medium">Manage today's queue and patient flow</p>
            </div>
          </div>
          <Link
            to="/waiting-room"
            target="_blank"
            id="open-waiting-room"
            className="glass-card !rounded-xl px-5 py-2.5 text-primary-500 font-semibold 
                       hover:shadow-neon-blue inline-flex items-center gap-2 text-sm
                       transition-all duration-300 hover:-translate-y-0.5"
          >
            <ExternalLink className="w-4 h-4" /> Open Waiting Room
          </Link>
        </motion.header>

        {/* ── Stats Grid ──────────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users,      label: 'Total Today',       value: patients.length,                    color: 'bg-blue-50 text-blue-600' },
            { icon: UserPlus,   label: 'Currently Waiting',  value: waitingPatients.length,             color: 'bg-teal-50 text-teal-600' },
            { icon: ListChecks, label: 'Current Token',      value: currentPatient ? `#${currentPatient.tokenNumber}` : '—', color: 'bg-amber-50 text-amber-600' },
            { icon: Clock,      label: 'Avg Consult Time',   value: `${settings.averageConsultationTime}m`, color: 'bg-purple-50 text-purple-600' },
          ].map(({ icon: Icon, label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="stat-card"
            >
              <div className={`stat-icon ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="stat-label">{label}</p>
                <p className="stat-value">{value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main Content Grid ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column: Forms ────────────── */}
          <motion.div variants={itemVariants} className="space-y-6 lg:col-span-1">
            {/* Add Patient Form */}
            <div className="form-card">
              <h2 className="form-title">
                <div className="p-2 bg-primary-50 text-primary-500 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                Add New Patient
              </h2>
              <form onSubmit={handleAddPatient} className="space-y-4" id="add-patient-form">
                <div>
                  <label className="input-label">Patient Name</label>
                  <input
                    id="patient-name"
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div>
                  <label className="input-label">Mobile Number</label>
                  <input
                    id="patient-mobile"
                    required
                    type="tel"
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    className="input-field"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="input-label">Age <span className="text-slate-400">(Optional)</span></label>
                  <input
                    id="patient-age"
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className="input-field"
                    placeholder="30"
                  />
                </div>
                <button id="generate-token-btn" type="submit" className="btn-primary">
                  Generate Token
                </button>
              </form>
            </div>

            {/* Settings Form */}
            <div className="form-card">
              <h2 className="form-title">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                  <Settings2 className="w-5 h-5" />
                </div>
                Consultation Settings
              </h2>
              <form onSubmit={handleUpdateSettings} className="space-y-4" id="settings-form">
                <div>
                  <label className="input-label">Avg Consultation Time (minutes)</label>
                  <input
                    id="avg-time-input"
                    required
                    type="number"
                    min="1"
                    value={settings.averageConsultationTime}
                    onChange={e => setSettings({ ...settings, averageConsultationTime: e.target.value })}
                    className="input-field"
                  />
                </div>
                <button id="save-settings-btn" type="submit" className="btn-secondary">
                  Save Settings
                </button>
              </form>
            </div>
          </motion.div>

          {/* ── Right Column: Queue Table ─────── */}
          <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-6 flex flex-col min-h-[520px]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-500" />
                Today's Queue
                <span className="ml-2 text-xs font-semibold bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                  {patients.length} patients
                </span>
              </h2>
              <button
                id="reset-queue-btn"
                onClick={handleResetQueue}
                className="text-sm font-semibold text-red-500 hover:text-red-600 
                           hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all duration-200
                           inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Queue
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-slate-100 custom-scrollbar">
              <table className="queue-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Patient Info</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {patients.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                              <Users className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-medium">No patients in the queue today.</p>
                            <p className="text-slate-300 text-sm">Add a patient using the form on the left.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      patients.map((patient, index) => (
                        <motion.tr
                          key={patient._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <td>
                            <span className="token-circle">{patient.tokenNumber}</span>
                          </td>
                          <td>
                            <div className="font-semibold text-slate-800">{patient.name}</div>
                            <div className="text-sm text-slate-400 mt-0.5">
                              {patient.mobile} {patient.age && `· ${patient.age} yrs`}
                            </div>
                            <div className="text-xs text-slate-300 mt-1 font-mono">
                              {new Date(patient.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td>
                            <span className={
                              patient.status === 'Waiting' ? 'badge-waiting' :
                              patient.status === 'In Consultation' ? 'badge-active' :
                              'badge-completed'
                            }>
                              {patient.status}
                            </span>
                          </td>
                          <td className="text-right space-x-2">
                            {patient.status === 'Waiting' && (
                              <button
                                onClick={() => handleStatusChange(patient._id, 'In Consultation')}
                                className="btn-call"
                              >
                                Call Next
                              </button>
                            )}
                            {patient.status === 'In Consultation' && (
                              <button
                                onClick={() => handleStatusChange(patient._id, 'Completed')}
                                className="btn-done"
                              >
                                Mark Done
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
