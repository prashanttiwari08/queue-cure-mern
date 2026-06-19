import React, { useState, useEffect } from 'react';
import { patientApi, settingsApi } from '../services/api';
import { socket } from '../sockets/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Activity, ArrowRight, Stethoscope, CheckCircle2 } from 'lucide-react';

export default function WaitingRoom() {
  const [patients, setPatients] = useState([]);
  const [settings, setSettings] = useState({ averageConsultationTime: 10 });
  const [currentDate, setCurrentDate] = useState(new Date());

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
      console.error('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();

    socket.on('PATIENT_ADDED', (newPatient) => {
      setPatients((prev) => [...prev, newPatient]);
    });

    socket.on('TOKEN_CALLED', (updatedPatient) => {
      setPatients((prev) => prev.map(p => p._id === updatedPatient._id ? updatedPatient : p));
    });

    socket.on('PATIENT_COMPLETED', (updatedPatient) => {
      setPatients((prev) => prev.map(p => p._id === updatedPatient._id ? updatedPatient : p));
    });

    socket.on('QUEUE_RESET', () => {
      setPatients([]);
    });

    socket.on('SET_AVG_TIME', (time) => {
      setSettings((prev) => ({ ...prev, averageConsultationTime: time }));
    });

    const timer = setInterval(() => setCurrentDate(new Date()), 1000);

    return () => {
      socket.off('PATIENT_ADDED');
      socket.off('TOKEN_CALLED');
      socket.off('PATIENT_COMPLETED');
      socket.off('QUEUE_RESET');
      socket.off('SET_AVG_TIME');
      clearInterval(timer);
    };
  }, []);

  const waitingPatients = patients.filter(p => p.status === 'Waiting');
  const currentPatient = patients.find(p => p.status === 'In Consultation');
  const completedPatients = patients.filter(p => p.status === 'Completed').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const totalPatients = patients.length;
  const servedPatientsCount = completedPatients.length + (currentPatient ? 1 : 0);
  const progressPercentage = totalPatients > 0 ? (servedPatientsCount / totalPatients) * 100 : 0;

  const estimatedWaitTime = waitingPatients.length * settings.averageConsultationTime;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden relative">
      {/* ── Animated Background Blobs ───────── */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[140px] pointer-events-none animate-float" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[140px] pointer-events-none animate-float" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Header ─────────────────────────── */}
      <header className="p-6 md:p-8 flex justify-between items-center z-10 border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25 animate-glow">
            <Stethoscope className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient-light">Queue Cure '26</h1>
            <p className="text-sm text-slate-500 font-medium tracking-wide">Outpatient Department</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-slate-200 font-mono tracking-wider">
            {currentDate.toLocaleTimeString()}
          </p>
          <p className="text-sm text-slate-500 font-medium">
            {currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {/* ── Main Content ───────────────────── */}
      <main className="flex-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 max-w-[1600px] mx-auto w-full">

        {/* ── Left: Now Serving + Stats ─────── */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Now Serving Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="dark-glass gradient-border p-10 lg:p-14 flex flex-col items-center justify-center flex-1 relative overflow-hidden"
          >
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-secondary to-primary-500 bg-300% animate-gradient-x" />
            
            <h2 className="text-xl md:text-2xl font-semibold text-slate-500 mb-6 uppercase tracking-[0.3em]">
              Now Serving
            </h2>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentPatient ? currentPatient._id : 'empty'}
                initial={{ opacity: 0, scale: 0.7, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                transition={{ type: 'spring', bounce: 0.35, duration: 0.6 }}
                className="text-center"
              >
                {currentPatient ? (
                  <>
                    <div className="token-giant mb-4">
                      {currentPatient.tokenNumber}
                    </div>
                    <div className="text-2xl md:text-3xl text-secondary font-semibold tracking-tight">
                      {currentPatient.name}
                    </div>
                    <div className="mt-3 badge-active text-sm">
                      In Consultation
                    </div>
                  </>
                ) : (
                  <div className="py-10">
                    <div className="text-5xl md:text-6xl font-bold text-slate-700 tracking-tight mb-4">
                      —
                    </div>
                    <p className="text-slate-600 text-lg font-medium">Waiting for next patient</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="dark-glass p-6 flex items-center gap-4"
            >
              <div className="p-3.5 bg-primary-500/10 text-primary-400 rounded-2xl">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium tracking-wide">Waiting Ahead</p>
                <p className="text-3xl font-bold text-slate-100 tracking-tight font-mono">{waitingPatients.length}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="dark-glass p-6 flex items-center gap-4"
            >
              <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium tracking-wide">Est. Wait Time</p>
                <p className="text-3xl font-bold text-slate-100 tracking-tight">
                  ~<span className="font-mono">{estimatedWaitTime}</span> min
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Right: Progress + Up Next ─────── */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="dark-glass p-8"
          >
            <h3 className="text-lg font-semibold text-slate-200 mb-5 flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-secondary" /> Queue Progress
            </h3>
            <div className="flex justify-between text-sm font-medium text-slate-500 mb-3">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {servedPatientsCount} Served
              </span>
              <span>{totalPatients} Total Today</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden border border-slate-700/50">
              <motion.div
                className="bg-gradient-to-r from-primary-500 via-blue-400 to-secondary h-3.5 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              >
                {/* Shimmer effect on progress bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer bg-[length:200%_100%] rounded-full" />
              </motion.div>
            </div>
            <p className="text-xs text-slate-600 mt-2 text-right font-mono">
              {Math.round(progressPercentage)}% complete
            </p>
          </motion.div>

          {/* Up Next List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="dark-glass p-8 flex-1 flex flex-col overflow-hidden"
          >
            <h3 className="text-lg font-semibold text-slate-200 mb-5 flex items-center gap-2.5">
              <ArrowRight className="w-5 h-5 text-primary-400" /> Up Next
              {waitingPatients.length > 0 && (
                <span className="ml-auto text-xs font-semibold bg-primary-500/10 text-primary-400 px-2.5 py-0.5 rounded-full">
                  {waitingPatients.length} waiting
                </span>
              )}
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              <AnimatePresence>
                {waitingPatients.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 flex flex-col items-center gap-3"
                  >
                    <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center">
                      <Users className="w-7 h-7 text-slate-600" />
                    </div>
                    <p className="text-slate-600 font-medium">No one is waiting currently.</p>
                  </motion.div>
                ) : (
                  waitingPatients.slice(0, 10).map((patient, index) => (
                    <motion.div
                      key={patient._id}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                      className="bg-slate-800/40 border border-slate-700/30 p-4 rounded-2xl 
                                 flex items-center justify-between
                                 hover:bg-slate-700/40 hover:border-slate-600/50
                                 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900/70 border border-slate-600/30 
                                        flex items-center justify-center font-bold text-lg text-slate-300 font-mono
                                        group-hover:border-primary-500/30 group-hover:text-primary-300
                                        transition-all duration-300">
                          {patient.tokenNumber}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                            {patient.name}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 font-mono">
                            {new Date(patient.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-600 font-mono 
                                      group-hover:text-slate-400 transition-colors">
                        #{index + 1}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
