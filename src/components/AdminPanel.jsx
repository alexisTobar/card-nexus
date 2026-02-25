import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { 
  Search, ShieldCheck, Phone, Eye, ArrowLeft, Loader2, Users, ExternalLink, Box
} from 'lucide-react';

export default function AdminPanel({ onClose, navigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, "users"));
        const snapshot = await getDocs(q);
        const userList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(userList);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleViewAlbum = (uid) => {
    // Primero cerramos el panel de admin
    onClose();
    // Luego navegamos a la ruta del dashboard de ese usuario específico
    // NOTA: Asegúrate que en tu archivo de Rutas (App.jsx o Main.jsx) 
    // el path sea '/dashboard/:uid'
    setTimeout(() => {
      navigate(`/dashboard/${uid}`);
    }, 100);
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.whatsapp?.includes(searchTerm) ||
    user.id.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0a0c] flex flex-col overflow-hidden">
      {/* HEADER DEL PANEL */}
      <header className="p-4 md:px-8 border-b-2 border-red-600 bg-[#0a0a0c] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2 text-white">
              <ShieldCheck className="text-red-600" /> PANEL <span className="text-[#ffcb05]">SISTEMA</span>
            </h2>
            <p className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.2em]">Acceso Maestro Administrador</p>
          </div>
        </div>

        <div className="hidden md:flex bg-white/5 border border-white/10 px-4 py-2 rounded-sm items-center gap-2">
          <Search size={16} className="text-slate-500" />
          <input 
            type="text" 
            placeholder="BUSCAR ENTRENADOR..." 
            className="bg-transparent outline-none text-[10px] font-black w-64 uppercase text-white placeholder:text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* CONTENIDO SCROLLABLE */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0a0a0c]">
        <div className="max-w-7xl mx-auto">
          {/* STATS RÁPIDAS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#111827] border-l-2 border-blue-500 p-4">
              <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Total Usuarios</p>
              <p className="text-2xl font-black text-white italic">{users.length}</p>
            </div>
            <div className="bg-[#111827] border-l-2 border-[#ffcb05] p-4">
              <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Catálogo Activo</p>
              <p className="text-2xl font-black text-white italic">{users.filter(u => u.whatsapp).length}</p>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-[#ffcb05]" size={40} />
              <p className="font-black text-[10px] uppercase tracking-widest text-slate-500 animate-pulse">Abriendo archivos secretos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((u) => (
                <div key={u.id} className="bg-[#111827] border border-white/5 p-5 group hover:border-[#ffcb05]/50 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <ShieldCheck size={40} className="text-white" />
                  </div>
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="relative shrink-0">
                      <img 
                        src={u.photoURL || "https://i.postimg.cc/SsfCGDqp/toppng-com-okemon-pokeball-game-go-icon-free-pokemon-go-979x979.png"} 
                        alt={u.displayName} 
                        className="w-14 h-14 rounded-full border-2 border-red-600 p-0.5 object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black uppercase text-sm truncate text-white leading-tight">
                        {u.displayName || 'Entrenador Anónimo'}
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono truncate mb-2">{u.email}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className="flex items-center gap-1 text-[8px] font-black bg-white/5 px-2 py-1 rounded text-[#ffcb05] border border-white/5">
                          <Phone size={10} /> {u.whatsapp || 'SIN TEL'}
                        </span>
                        {u.whatsapp && (
                           <span className="text-[8px] font-black bg-green-500/10 text-green-500 px-2 py-1 rounded border border-green-500/20">
                             VERIFICADO
                           </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-white/5 flex gap-2">
                    <button 
                      onClick={() => handleViewAlbum(u.id)}
                      className="flex-1 bg-[#ffcb05] text-black font-black text-[10px] uppercase py-2 flex items-center justify-center gap-2 hover:bg-white transition-all shadow-[3px_3px_0px_0px_rgba(255,203,5,0.2)]"
                    >
                      <Eye size={14} /> VER ÁLBUM COMPLETO
                    </button>
                    
                    {u.whatsapp && (
                      <button 
                        onClick={() => window.open(`https://wa.me/${u.whatsapp}`, '_blank')}
                        className="bg-white/5 text-white p-2 border border-white/10 hover:bg-green-600 hover:border-green-600 transition-all"
                        title="WhatsApp Directo"
                      >
                        <ExternalLink size={14} />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                     <span className="text-[7px] font-mono text-slate-700 uppercase">UID: {u.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-32 border-2 border-dashed border-white/5">
              <Users className="mx-auto text-slate-800 mb-4" size={48} />
              <p className="font-black uppercase text-slate-500 italic text-sm tracking-tighter">No se encontraron registros en el sistema</p>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER PANEL */}
      <footer className="p-3 border-t border-white/5 bg-black text-center shrink-0">
        <p className="text-[8px] font-mono text-slate-600 uppercase tracking-[0.5em]">
          POKEALBUM_ROOT_ACCESS // SANTIAGO_CHILE // 2026
        </p>
      </footer>
    </div>
  );
}