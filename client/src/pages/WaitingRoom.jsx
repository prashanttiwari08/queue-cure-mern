import React, { useState, useEffect } from 'react';
import { patientApi, settingsApi } from '../services/api';
import { socket } from '../sockets/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Activity, ArrowRight } from 'lucide-react';

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
      // Optional: Play a sound when a token is called
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="p-6 md:p-8 flex justify-between items-center z-10 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">Queue Cure '26</h1>
            <p className="text-sm text-slate-400 font-medium">Outpatient Department</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-medium text-slate-200">{currentDate.toLocaleTimeString()}</p>
          <p className="text-sm text-slate-400">{currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 max-w-[1600px] mx-auto w-full">
        {/* Left Column - Current Token */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700/50 p-10 lg:p-16 flex flex-col items-center justify-center flex-1 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500"></div>
            <h2 className="text-2xl md:text-3xl font-medium text-slate-400 mb-8 uppercase tracking-widest">Now Serving</h2>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPatient ? currentPatient._id : 'empty'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ type: "spring", bounce: 0.4 }}
                className="text-center"
              >
                {currentPatient ? (
                  <>
                    <div className="text-[120px] md:text-[180px] font-bold leading-none text-white tracking-tighter drop-shadow-2xl mb-4">
                      {currentPatient.tokenNumber}
                    </div>
                    <div className="text-2xl md:text-3xl text-teal-400 font-medium">{currentPatient.name}</div>
                  </>
                ) : (
                  <div className="text-6xl font-bold text-slate-600 tracking-tight py-12">Please Wait</div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex items-center gap-4 backdrop-blur-sm">
              <div className="p-4 bg-blue-500/10 text-blue-400 rounded-xl"><Users className="w-8 h-8" /></div>
              <div>
                <p className="text-slate-400 text-sm md:text-base font-medium">Waiting Ahead</p>
                <p className="text-3xl font-bold text-slate-100">{waitingPatients.length}</p>
              </div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex items-center gap-4 backdrop-blur-sm">
              <div className="p-4 bg-amber-500/10 text-amber-400 rounded-xl"><Clock className="w-8 h-8" /></div>
              <div>
                <p className="text-slate-400 text-sm md:text-base font-medium">Est. Wait Time</p>
                <p className="text-3xl font-bold text-slate-100">~{estimatedWaitTime} min</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Queue Status */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Progress Section */}
          <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700/50 p-8 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-200 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" /> Queue Progress
            </h3>
            <div className="flex justify-between text-sm font-medium text-slate-400 mb-3">
              <span>{servedPatientsCount} Served</span>
              <span>{totalPatients} Total Today</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-teal-400 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Up Next / Waiting List */}
          <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700/50 p-8 flex-1 shadow-xl flex flex-col overflow-hidden">
            <h3 className="text-xl font-semibold text-slate-200 mb-6 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-400" /> Up Next
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              <AnimatePresence>
                {waitingPatients.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-500 text-center py-8">
                    No one is waiting currently.
                  </motion.div>
                ) : (
                  waitingPatients.slice(0, 8).map((patient, index) => (
                    <motion.div 
                      key={patient._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-slate-700/30 border border-slate-600/30 p-4 rounded-xl flex items-center justify-between group hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-900/50 border border-slate-600/50 flex items-center justify-center font-bold text-lg text-slate-300">
                          {patient.tokenNumber}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{patient.name}</div>
                          <div className="text-sm text-slate-500">Waiting</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-slate-500">
                        #{index + 1}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
