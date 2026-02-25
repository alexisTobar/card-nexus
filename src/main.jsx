import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { Loader2 } from 'lucide-react';
import './index.css';

// OPTIMIZACIÓN: Carga perezosa de componentes (Code Splitting)
// Esto hace que el navegador solo descargue el Dashboard o el Perfil cuando entras en ellos.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

// Un componente simple de carga para mostrar mientras se descargan las páginas
const PageLoader = () => (
  <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
    <Loader2 className="animate-spin text-[#ffcb05]" size={40} />
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Suspense es necesario para envolver las rutas con lazy load */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* La página principal carga normal (eager) porque es la entrada */}
          <Route path="/" element={<App />} />
          
          {/* Dashboard y Perfil ahora se cargan solo bajo demanda */}
          <Route path="/dashboard/:uid" element={<Dashboard />} />

          {/* La página pública que verá la gente */}
          <Route path="/perfil/:uid" element={<Profile />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);