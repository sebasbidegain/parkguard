import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { ClipboardList, PlusCircle, BarChart3, Search, Settings as SettingsIcon } from 'lucide-react';
import { initDatabase } from './db/database';
import Dashboard from './pages/Dashboard';
import NewTicket from './pages/NewTicket';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import './App.css';

function AppHeader() {
  const navigate = useNavigate();
  return (
    <header className="app-header">
      <h1>ParkGuard</h1>
      <button className="header-btn" onClick={() => navigate('/settings')} title="Settings">
        <SettingsIcon size={20} />
      </button>
    </header>
  );
}

function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="app-loading">
        <p className="error">Failed to initialize database: {error}</p>
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <AppHeader />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<NewTicket />} />
            <Route path="/tickets" element={<TicketList />} />
            <Route path="/ticket/:id" element={<TicketDetail />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        <nav className="bottom-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <ClipboardList size={22} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/tickets" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Search size={22} />
            <span>Tickets</span>
          </NavLink>
          <NavLink to="/new" className="nav-item nav-item-new">
            <PlusCircle size={32} />
            <span>New</span>
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <BarChart3 size={22} />
            <span>Stats</span>
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  );
}

export default App;
