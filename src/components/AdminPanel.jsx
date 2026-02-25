import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  doc, 
  writeBatch, 
  where 
} from 'firebase/firestore';
import { 
  Search, ShieldCheck, Phone, Eye, ArrowLeft, Loader2, Users, ExternalLink, Trash2, AlertTriangle 
} from 'lucide-react';

export default function AdminPanel({ onClose, navigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, userId: null, userName: "" });

  const fetchUsers = async () => {
    setLoading(true);
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

  useEffect(() => {
    fetchUsers();
  }, []);

  // FUNCIÓN DE LIMPIEZA TOTAL DE BASE DE DATOS
  const handleDeleteUser = async () => {
    if (!deleteConfirm.userId) return;
    
    setIsDeleting(true);
    const batch = writeBatch(db);
    const uid = deleteConfirm.userId;

    try {
      // 1. Borrar documento del Usuario
      const userRef = doc(db, "users", uid);
      batch.delete(userRef);

      // 2. Borrar sus Álbumes
      const albumsQ = query(collection(db, "albums"), where("uid", "==", uid));
      const albumsSnap = await getDocs(albumsQ);
      albumsSnap.forEach((doc) => batch.delete(doc.ref));

      // 3. Borrar sus Cartas
      const cardsQ = query(collection(db, "userCollections"), where("uid", "==", uid));
      const cardsSnap = await getDocs(cardsQ);
      cardsSnap.forEach((doc) => batch.delete(doc.ref));

      // Ejecutar la operación masiva
      await batch.commit();
      
      setDeleteConfirm({ show: false, userId: null, userName: "" });
      await fetchUsers(); // Recargar lista
      alert("Limpieza exitosa: Usuario y datos asociados eliminados.");
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error de permisos o conexión. Revisa las reglas de Firebase.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewAlbum = (uid) => {
    onClose();
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
      {/* HEADER */}
      <header className="p-4 md:px-8 border-b-2 border-red-600 bg-[#0a0a0c] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2 text-white">
              <ShieldCheck className="text-red-600" /> PANEL <span className="text-[#ffcb05]">SISTEMA</span>
            </h2>
            <p className="text-[8px] font-mono text-slate-500 uppercase">Limpieza de Datos Maestra</p>
          </div>
        </div>
        <div className="hidden md:flex bg-white/5 border border-white/10 px-4 py-2 rounded-sm items-center gap-2">
          <Search size={16} className="text-slate-500" />
          <input 
            type="text" 
            placeholder="BUSCAR ENTRENADOR..." 
            className="bg-transparent outline-none text-[10px] font-black w-64 uppercase text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0a0a0c]">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-[#ffcb05]" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((u) => (
                <div key={u.id} className="bg-[#111827] border border-white/5 p-5 group hover:border-red-600 transition-all relative">
                  <div className="flex items-center gap-4 relative z-10">
                    <img 
                      src={u.photoURL || "https://i.postimg.cc/SsfCGDqp/toppng-com-okemon-pokeball-game-go-icon-free-pokemon-go-979x979.png"} 
                      className="w-14 h-14 rounded-full border-2 border-red-600 p-0.5 object-cover"
                      alt="avatar"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-black uppercase text-sm truncate text-white">{u.displayName || 'Anónimo'}</p>
                      <p className="text-[9px] text-slate-500 font-mono truncate italic">ID: {u.id}</p>
                    </div>
                    <button 
                      onClick={() => setDeleteConfirm({ show: true, userId: u.id, userName: u.displayName })}
                      className="p-2 text-slate-600 hover:text-red-500 transition-all hover:scale-110"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-white/5 flex gap-2">
                    <button 
                      onClick={() => handleViewAlbum(u.id)}
                      className="flex-1 bg-[#ffcb05] text-black font-black text-[10px] uppercase py-2 flex items-center justify-center gap-2 hover:bg-white transition-colors"
                    >
                      <Eye size={14} /> VER ÁLBUM
                    </button>
                    {u.whatsapp && (
                        <button 
                          onClick={() => window.open(`https://wa.me/${u.whatsapp}`, '_blank')}
                          className="p-2 bg-white/5 text-white border border-white/10 hover:bg-green-600"
                        >
                          <ExternalLink size={14} />
                        </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0a0c] border-2 border-red-600 p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <AlertTriangle className="text-red-600 mx-auto mb-4 animate-pulse" size={48} />
            <h3 className="text-white font-black uppercase text-lg mb-2 italic">¿PURGAR SISTEMA?</h3>
            <p className="text-slate-400 text-[10px] mb-6 uppercase tracking-widest leading-relaxed">
              Eliminarás a <span className="text-white font-bold">{deleteConfirm.userName}</span> junto con todos sus <span className="text-red-500">álbumes y cartas</span> de forma permanente.
            </p>
            <div className="flex gap-4">
              <button 
                disabled={isDeleting}
                onClick={() => setDeleteConfirm({ show: false, userId: null, userName: "" })}
                className="flex-1 bg-white/5 text-white font-black py-3 text-[10px] uppercase hover:bg-white/10"
              >
                Cancelar
              </button>
              <button 
                disabled={isDeleting}
                onClick={handleDeleteUser}
                className="flex-1 bg-red-600 text-white font-black py-3 text-[10px] uppercase hover:bg-red-700 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={14} /> : 'BORRAR TODO'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="p-3 border-t border-white/5 bg-black text-center shrink-0">
        <p className="text-[8px] font-mono text-slate-600 uppercase tracking-[0.5em]">ROOT_USER // SANTIAGO_SYSTEM // 2026</p>
      </footer>
    </div>
  );
}