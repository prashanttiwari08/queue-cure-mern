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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative"
         style={{ fontFamily: 'var(--font-sans)' }}>
      {/* ── Animated Background Blobs ───────── */}
      <div className="absolute rounded-full blur-[140px] pointer-events-none"
           style={{ top: '-15%', left: '-10%', width: '50%', height: '50%', background: 'rgba(37,99,235,0.1)', animation: 'float 6s ease-in-out infinite' }} />
      <div className="absolute rounded-full blur-[140px] pointer-events-none"
           style={{ bottom: '-15%', right: '-10%', width: '50%', height: '50%', background: 'rgba(20,184,166,0.1)', animation: 'float 6s ease-in-out infinite 3s' }} />
      <div className="absolute rounded-full blur-[100px] pointer-events-none"
           style={{ top: '40%', right: '20%', width: '30%', height: '30%', background: 'rgba(99,102,241,0.05)' }} />

      {/* ── Header ─────────────────────────── */}
      <header className="p-6 md:p-8 flex justify-between items-center z-10 border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#2563EB] to-[#14B8A6] rounded-2xl flex items-center justify-center shadow-lg"
               style={{ animation: 'glow 2s ease-in-out infinite alternate', boxShadow: '0 8px 24px rgba(37,99,235,0.25)' }}>
            <Stethoscope className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient-light">Queue Cure '26</h1>
            <p className="text-sm text-slate-500 font-medium tracking-wide">Outpatient Department</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-slate-200 tracking-wider"
             style={{ fontFamily: 'var(--font-mono)' }}>
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
            <div className="absolute top-0 left-0 w-full h-1"
                 style={{
                   background: 'linear-gradient(to right, #2563EB, #14B8A6, #2563EB)',
                   backgroundSize: '300% 100%',
                   animation: 'gradientX 3s ease infinite'
                 }} />

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
                    <div className="text-2xl md:text-3xl text-[#14B8A6] font-semibold tracking-tight">
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
              <div className="p-3.5 rounded-2xl" style={{ background: 'rgba(37,99,235,0.1)', color: '#60a5fa' }}>
                <Users className="w-7 h-7" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium tracking-wide">Waiting Ahead</p>
                <p className="text-3xl font-bold text-slate-100 tracking-tight"
                   style={{ fontFamily: 'var(--font-mono)' }}>{waitingPatients.length}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="dark-glass p-6 flex items-center gap-4"
            >
              <div className="p-3.5 rounded-2xl" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium tracking-wide">Est. Wait Time</p>
                <p className="text-3xl font-bold text-slate-100 tracking-tight">
                  ~<span style={{ fontFamily: 'var(--font-mono)' }}>{estimatedWaitTime}</span> min
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
              <Activity className="w-5 h-5 text-[#14B8A6]" /> Queue Progress
            </h3>
            <div className="flex justify-between text-sm font-medium text-slate-500 mb-3">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {servedPatientsCount} Served
              </span>
              <span>{totalPatients} Total Today</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden border border-slate-700/50">
              <motion.div
                className="h-3.5 rounded-full relative"
                style={{ background: 'linear-gradient(to right, #2563EB, #60a5fa, #14B8A6)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 rounded-full"
                     style={{
                       background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
                       backgroundSize: '200% 100%',
                       animation: 'shimmer 2s linear infinite'
                     }} />
              </motion.div>
            </div>
            <p className="text-xs text-slate-600 mt-2 text-right" style={{ fontFamily: 'var(--font-mono)' }}>
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
              <ArrowRight className="w-5 h-5 text-[#60a5fa]" /> Up Next
              {waitingPatients.length > 0 && (
                <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(37,99,235,0.1)', color: '#60a5fa' }}>
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
                      className="p-4 rounded-2xl flex items-center justify-between group transition-all duration-300"
                      style={{
                        background: 'rgba(30,41,59,0.4)',
                        border: '1px solid rgba(51,65,85,0.3)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(51,65,85,0.4)';
                        e.currentTarget.style.borderColor = 'rgba(71,85,105,0.5)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(30,41,59,0.4)';
                        e.currentTarget.style.borderColor = 'rgba(51,65,85,0.3)';
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-slate-300"
                             style={{
                               fontFamily: 'var(--font-mono)',
                               background: 'rgba(15,23,42,0.7)',
                               border: '1px solid rgba(71,85,105,0.3)',
                             }}>
                          {patient.tokenNumber}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">
                            {patient.name}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                            {new Date(patient.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
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
