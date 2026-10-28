import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Calendar, LogOut, Plus, Trash2, CheckCircle, Clock, XCircle, Stethoscope, Search, LayoutDashboard, Eye, ArrowLeft } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // État pour la vue détails d'un patient
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);

  // Formulaires
  const [newPatient, setNewPatient] = useState({ fullName: '', cin: '', phone: '', birthDate: '', address: '' });
  const [newAppt, setNewAppt] = useState({ patientId: '', appointmentDate: '', status: 'pending', reason: '', notes: '' });

  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    if (token) {
      fetchPatients();
      fetchAppointments();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.clear();
  };

  const fetchPatients = async (query = '') => {
    try {
      const res = await api.get(`/patients?search=${query}`);
      const data = res.data.patients || res.data;
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const res = await api.get(`/patients/${patientId}`);
      setPatientDetails(res.data);
      setSelectedPatient(patientId);
    } catch (err) {
      alert('Erreur lors de la récupération des détails du patient.');
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      await api.post('/patients', newPatient);
      setNewPatient({ fullName: '', cin: '', phone: '', birthDate: '', address: '' });
      fetchPatients();
      alert('Patient ajouté avec succès !');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la création (vérifiez le doublon CIN).');
    }
  };

  const handleDeletePatient = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce patient ?')) return;
    try {
      await api.delete(`/patients/${id}`);
      fetchPatients();
    } catch (err) {
      alert(err.response?.data?.error || 'Action réservée aux administrateurs.');
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', newAppt);
      setNewAppt({ patientId: '', appointmentDate: '', status: 'pending', reason: '', notes: '' });
      fetchAppointments();
      alert('Rendez-vous planifié avec succès !');
    } catch (err) {
      alert(err.response?.data?.error || 'Conflit détecté : intervalle de 30 minutes requis.');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      fetchAppointments();
    } catch (err) {
      alert('Erreur lors de la mise à jour du statut.');
    }
  };

  // Calculs pour le Dashboard
  const todayStr = new Date().toISOString().split('T')[0];
  const totalPatientsCount = patients.length;
  const todaysAppointmentsCount = appointments.filter(a => a.appointmentdate?.startsWith(todayStr)).length;
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-cyan-500 p-3 rounded-xl text-slate-900"><Stethoscope size={28} /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">ClinicFlow</h1>
              <p className="text-sm text-slate-400">Test Technique Tython</p>
            </div>
          </div>
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Email Professionnel</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500" placeholder="admin@clinicflow.com" />
            </div>
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-lg transition-all shadow-lg">
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-cyan-500 p-2.5 rounded-xl text-slate-950"><Stethoscope size={24} /></div>
            <span className="text-xl font-bold tracking-wider text-white">ClinicFlow</span>
          </div>
          <nav className="space-y-2">
            <button onClick={() => { setActiveTab('dashboard'); setSelectedPatient(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'dashboard' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <LayoutDashboard size={20} /> Dashboard
            </button>
            <button onClick={() => { setActiveTab('patients'); setSelectedPatient(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'patients' && !selectedPatient ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Users size={20} /> Patients
            </button>
            <button onClick={() => { setActiveTab('appointments'); setSelectedPatient(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'appointments' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Calendar size={20} /> Rendez-vous
            </button>
          </nav>
        </div>
        <div className="border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-400 mb-2 truncate">Rôle : <strong className="text-cyan-400 uppercase">{user?.role}</strong></div>
          <div className="text-xs text-slate-400 mb-2 truncate">Connecté : <strong className="text-white">{user?.email}</strong></div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-2.5 rounded-xl transition-all text-sm font-semibold">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Tableau de Bord (Dashboard)</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400">Total Patients</p>
                  <h3 className="text-4xl font-bold text-white mt-2">{totalPatientsCount}</h3>
                </div>
                <div className="bg-cyan-500/10 text-cyan-400 p-4 rounded-xl"><Users size={28} /></div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400">RDV du Jour</p>
                  <h3 className="text-4xl font-bold text-white mt-2">{todaysAppointmentsCount}</h3>
                </div>
                <div className="bg-blue-500/10 text-blue-400 p-4 rounded-xl"><Calendar size={28} /></div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400">En attente (Pending)</p>
                  <h3 className="text-4xl font-bold text-amber-400 mt-2">{pendingCount}</h3>
                </div>
                <div className="bg-amber-500/10 text-amber-400 p-4 rounded-xl"><Clock size={28} /></div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400">Confirmés</p>
                  <h3 className="text-4xl font-bold text-emerald-400 mt-2">{confirmedCount}</h3>
                </div>
                <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl"><CheckCircle size={28} /></div>
              </div>
            </div>
          </div>
        )}

        {/* PATIENTS TAB */}
        {activeTab === 'patients' && !selectedPatient && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white">Gestion des Patients</h1>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input type="text" placeholder="Rechercher par nom ou CIN..." value={searchTerm} 
                  onChange={e => { setSearchTerm(e.target.value); fetchPatients(e.target.value); }}
                  className="bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 w-72 text-sm" />
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 shadow-xl">
              <h2 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2"><Plus size={18} /> Ajouter un nouveau patient</h2>
              <form onSubmit={handleCreatePatient} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Nom complet" value={newPatient.fullName} onChange={e => setNewPatient({...newPatient, fullName: e.target.value})} required className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" />
                <input type="text" placeholder="CIN (ex: AB123456)" value={newPatient.cin} onChange={e => setNewPatient({...newPatient, cin: e.target.value})} required className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" />
                <input type="text" placeholder="Téléphone" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} required className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" />
                <input type="date" value={newPatient.birthDate} onChange={e => setNewPatient({...newPatient, birthDate: e.target.value})} required className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" />
                <input type="text" placeholder="Adresse" value={newPatient.address} onChange={e => setNewPatient({...newPatient, address: e.target.value})} required className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" />
                <button type="submit" className="bg-cyan-500 text-slate-950 font-bold rounded-lg p-3 hover:bg-cyan-400 transition-all">Enregistrer le patient</button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950/50">
                    <th className="p-4">Nom complet</th>
                    <th className="p-4">CIN</th>
                    <th className="p-4">Téléphone</th>
                    <th className="p-4">Adresse</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {patients.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/50">
                      <td className="p-4 font-medium text-white">{p.fullname || p.fullName}</td>
                      <td className="p-4 text-cyan-400 font-mono">{p.cin}</td>
                      <td className="p-4 text-slate-300">{p.phone}</td>
                      <td className="p-4 text-slate-400">{p.address}</td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => fetchPatientDetails(p.id)} className="text-cyan-400 hover:text-cyan-300 p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 transition-all" title="Voir détails et RDV">
                          <Eye size={16} />
                        </button>
                        {user?.role === 'admin' && (
                          <button onClick={() => handleDeletePatient(p.id)} className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-lg border border-red-500/20 transition-all" title="Supprimer (Admin only)">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PATIENT DETAILS VIEW */}
        {activeTab === 'patients' && selectedPatient && patientDetails && (
          <div>
            <button onClick={() => setSelectedPatient(null)} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 font-semibold">
              <ArrowLeft size={18} /> Retour à la liste des patients
            </button>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 shadow-xl">
              <h1 className="text-2xl font-bold text-white mb-4">Dossier Patient : {patientDetails.patient.fullname || patientDetails.patient.fullName}</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-slate-400 block">CIN</span> <strong className="text-cyan-400 font-mono">{patientDetails.patient.cin}</strong></div>
                <div><span className="text-slate-400 block">Téléphone</span> <strong className="text-white">{patientDetails.patient.phone}</strong></div>
                <div><span className="text-slate-400 block">Date de naissance</span> <strong className="text-white">{patientDetails.patient.birthdate || patientDetails.patient.birthDate}</strong></div>
                <div><span className="text-slate-400 block">Adresse</span> <strong className="text-white">{patientDetails.patient.address}</strong></div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-4">Historique des Rendez-vous de ce patient</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950/50">
                    <th className="p-4">Date & Heure</th>
                    <th className="p-4">Motif</th>
                    <th className="p-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {patientDetails.appointments.length === 0 ? (
                    <tr><td colSpan="3" className="p-6 text-center text-slate-500">Aucun rendez-vous pour ce patient.</td></tr>
                  ) : (
                    patientDetails.appointments.map(a => (
                      <tr key={a.id} className="hover:bg-slate-800/50">
                        <td className="p-4 text-cyan-400">{new Date(a.appointmentdate || a.appointmentDate).toLocaleString()}</td>
                        <td className="p-4 text-slate-300">{a.reason}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            a.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            a.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>{a.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Gestion des Rendez-vous</h1>
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 shadow-xl">
              <h2 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2"><Plus size={18} /> Planifier un rendez-vous (Règle 30 min active)</h2>
              <form onSubmit={handleCreateAppointment} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select value={newAppt.patientId} onChange={e => setNewAppt({...newAppt, patientId: e.target.value})} required className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white">
                  <option value="">Sélectionner un patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.fullname || p.fullName} ({p.cin})</option>)}
                </select>
                <input type="datetime-local" value={newAppt.appointmentDate} onChange={e => setNewAppt({...newAppt, appointmentDate: e.target.value})} required className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" />
                <select value={newAppt.status} onChange={e => setNewAppt({...newAppt, status: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white">
                  <option value="pending">En attente (pending)</option>
                  <option value="confirmed">Confirmé (confirmed)</option>
                  <option value="cancelled">Annulé (cancelled)</option>
                </select>
                <input type="text" placeholder="Motif de consultation" value={newAppt.reason} onChange={e => setNewAppt({...newAppt, reason: e.target.value})} required className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white md:col-span-2" />
                <button type="submit" className="bg-cyan-500 text-slate-950 font-bold rounded-lg p-3 hover:bg-cyan-400 transition-all">Planifier</button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-950/50">
                    <th className="p-4">Patient</th>
                    <th className="p-4">Date & Heure</th>
                    <th className="p-4">Motif</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4">Créé par</th>
                    <th className="p-4 text-right">Modifier statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {appointments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-800/50">
                      <td className="p-4 font-medium text-white">{a.patientname || a.patientName}</td>
                      <td className="p-4 text-cyan-400">{new Date(a.appointmentdate || a.appointmentDate).toLocaleString()}</td>
                      <td className="p-4 text-slate-300">{a.reason}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          a.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          a.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>{a.status}</span>
                      </td>
                      <td className="p-4 text-slate-500 text-xs">{a.createdbyemail || a.createdByEmail}</td>
                      <td className="p-4 text-right space-x-1">
                        <button onClick={() => handleUpdateStatus(a.id, 'confirmed')} className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition-all" title="Confirmer"><CheckCircle size={16} /></button>
                        <button onClick={() => handleUpdateStatus(a.id, 'pending')} className="p-1.5 bg-amber-500/10 text-amber-400 rounded hover:bg-amber-500/20 transition-all" title="Mettre en attente"><Clock size={16} /></button>
                        <button onClick={() => handleUpdateStatus(a.id, 'cancelled')} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-all" title="Annuler"><XCircle size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}