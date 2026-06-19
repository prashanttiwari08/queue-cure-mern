import React, { useState, useEffect } from 'react';
import { patientApi, settingsApi } from '../services/api';
import { socket } from '../sockets/socket';
import toast from 'react-hot-toast';
import { Users, UserPlus, Clock, ListChecks, Settings2 } from 'lucide-react';
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
      // Event handles the UI update
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

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reception Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage today's queue and patient flow</p>
          </div>
          <Link to="/waiting-room" target="_blank" className="bg-white border shadow-sm px-4 py-2 rounded-lg text-primary font-medium hover:bg-slate-50 transition-colors inline-flex items-center gap-2">
            <Users className="w-5 h-5" /> Open Waiting Room
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Today</p>
              <p className="text-2xl font-bold text-slate-900">{patients.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl"><UserPlus className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Currently Waiting</p>
              <p className="text-2xl font-bold text-slate-900">{waitingPatients.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><ListChecks className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Current Token</p>
              <p className="text-2xl font-bold text-slate-900">{currentPatient ? currentPatient.tokenNumber : '-'}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Clock className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg Consult Time</p>
              <p className="text-2xl font-bold text-slate-900">{settings.averageConsultationTime}m</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Forms */}
          <div className="space-y-6 lg:col-span-1">
            {/* Add Patient Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" /> Add New Patient
              </h2>
              <form onSubmit={handleAddPatient} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                  <input required type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="+1 234 567 8900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Age (Optional)</label>
                  <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="30" />
                </div>
                <button type="submit" className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm">
                  Generate Token
                </button>
              </form>
            </div>

            {/* Settings Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-slate-600" /> Consultation Settings
              </h2>
              <form onSubmit={handleUpdateSettings} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Avg Time (minutes)</label>
                  <input required type="number" min="1" value={settings.averageConsultationTime} onChange={e => setSettings({...settings, averageConsultationTime: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                </div>
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm">
                  Save Settings
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Queue Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-full min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Today's Queue</h2>
              <button onClick={handleResetQueue} className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors">
                Reset Queue
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Token</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Patient Info</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                        No patients in the queue today.
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold text-lg">
                            {patient.tokenNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{patient.name}</div>
                          <div className="text-sm text-slate-500">{patient.mobile} {patient.age && `• ${patient.age} yrs`}</div>
                          <div className="text-xs text-slate-400 mt-1">{new Date(patient.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                            ${patient.status === 'Waiting' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                              patient.status === 'In Consultation' ? 'bg-teal-50 text-teal-700 border-teal-200' : 
                              'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {patient.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {patient.status === 'Waiting' && (
                            <button onClick={() => handleStatusChange(patient._id, 'In Consultation')} className="inline-flex items-center justify-center px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                              Call Next
                            </button>
                          )}
                          {patient.status === 'In Consultation' && (
                            <button onClick={() => handleStatusChange(patient._id, 'Completed')} className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                              Mark Done
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
