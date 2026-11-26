import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Sparkles, Search, User } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Visualizer } from './components/Visualizer';
import { SystemDesign } from './components/SystemDesign';
import { LLDStudio } from './components/lld/LLDStudio';
import { AppShellContext } from './AppShellContext';
import './index.css';

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [activeCategory, setActiveCategory] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isProblemPage =
    location.pathname.startsWith('/problem/') ||
    location.pathname.startsWith('/system-design/');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  const toggleSidebar = () => {
    setSidebarOpen(o => !o);
  };

  const handleSelectCategory = (c: string) => {
    setActiveCategory(c);
    setSidebarOpen(false);
    if (isProblemPage) navigate('/');
  };

  return (
    <AppShellContext.Provider value={{ theme, toggleTheme, sidebarOpen, toggleSidebar, isProblemPage }}>
      <div>
        {!isProblemPage && (
          <header>
            <div className="header-left">
              <h1
                className="brand-link"
                onClick={() => {
                  setSidebarOpen(false);
                  navigate('/');
                }}
              >
                <Sparkles size={22} color="var(--accent)" /> AlgoVisualizer
              </h1>
            </div>
            <div className="header-actions">
              <div className="search-bar">
                <Search size={16} color="var(--muted)" />
                <input type="text" placeholder="Search" />
              </div>
              <button className="theme-toggle-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              {isLoggedIn ? (
                <div className="profile-icon" onClick={() => setIsLoggedIn(false)} style={{ cursor: 'pointer' }} title="Log out">
                  <User size={18} />
                </div>
              ) : (
                <button className="header-signin-btn" onClick={() => setIsLoggedIn(true)}>
                  Sign In
                </button>
              )}
            </div>
          </header>
        )}

        <div className={`layout ${isProblemPage ? 'problem-focus-layout' : ''}`}>
          {!isProblemPage && (
            <Sidebar activeCategory={activeCategory} setActiveCategory={handleSelectCategory} />
          )}

          {isProblemPage && sidebarOpen && (
            <>
              <div className="sidebar-drawer-backdrop" onClick={() => setSidebarOpen(false)} />
              <div className="sidebar-drawer">
                <Sidebar activeCategory={activeCategory} setActiveCategory={handleSelectCategory} />
              </div>
            </>
          )}
          
          <Routes>
            <Route path="/" element={
              activeCategory === 'system-design' 
                ? <SystemDesign />
                : <Dashboard category={activeCategory} onVisualize={(id) => {
                  const [problemId, query] = id.split('?');
                  navigate(`/problem/${problemId}${query ? '?' + query : ''}`);
                }} isLoggedIn={isLoggedIn} />
            } />
            <Route path="/problem/:id" element={<Visualizer />} />
            <Route
              path="/system-design/:slug"
              element={
                <LLDStudio
                  onBackToSD={() => {
                    setActiveCategory('system-design');
                    navigate('/');
                  }}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </AppShellContext.Provider>
  );
}

export default App;
