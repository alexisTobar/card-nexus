import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Search, Plus, Trash2, Loader2, Sparkles, X, Copy, Check, ExternalLink, AlertCircle, MessageCircle, Layers, Edit3, BookOpen, AlertTriangle, Minus, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function Dashboard() {
  const { uid: urlUid } = useParams();
  const navigate = useNavigate();

  // ESTADOS PRINCIPALES
  const [myCards, setMyCards] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileUrl, setProfileUrl] = useState("");

  // ESTADOS DE BUSQUEDA Y UI
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [selectedCard, setSelectedCard] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    price: "", status: "Near Mint", language: "Inglés", quantity: 1, delivery: ""
  });

  // DETERMINAR USUARIO OBJETIVO
  // Si hay un UID en la URL, usamos ese. Si no, usamos el del usuario logueado.
  const [currentUser, setCurrentUser] = useState(null);
  const targetUid = urlUid || auth.currentUser?.uid;
  const isAdminView = urlUid && auth.currentUser?.uid !== urlUid;

  // 1. GESTIÓN DE AUTENTICACIÓN
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else if (!urlUid) {
        // Si no está logueado y no está viendo un perfil ajeno, va al login
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate, urlUid]);

  // 2. CARGAR COLECCIÓN (Memorizado para evitar re-renders infinitos)
  const loadMyCollection = useCallback(async (uid, albumId) => {
    if (!uid || !albumId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "userCollections"),
        where("uid", "==", uid),
        where("albumId", "==", albumId)
      );
      const snap = await getDocs(q);
      const cards = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyCards(cards);
    } catch (err) {
      console.error("Error cargando cartas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. CARGAR ÁLBUMES Y PERFIL
  useEffect(() => {
    const initLoad = async () => {
      if (!targetUid) return;

      try {
        setLoading(true);
        // Cargar Perfil (WhatsApp)
        const userDoc = await getDoc(doc(db, "users", targetUid));
        if (userDoc.exists()) setWhatsapp(userDoc.data().whatsapp || "");

        // Cargar Álbumes
        const q = query(collection(db, "albums"), where("uid", "==", targetUid));
        const snap = await getDocs(q);
        const albumList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAlbums(albumList);

        if (albumList.length > 0) {
          setActiveAlbum(albumList[0]);
          loadMyCollection(targetUid, albumList[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error en carga inicial:", err);
        setLoading(false);
      }
    };

    initLoad();
  }, [targetUid, loadMyCollection]);

  // 4. ACTUALIZAR URL COMPARTIBLE
  useEffect(() => {
    if (targetUid && activeAlbum) {
      setProfileUrl(`${window.location.origin}/perfil/${targetUid}?album=${activeAlbum.id}`);
    }
  }, [activeAlbum, targetUid]);

  // ACCIONES: CREAR ÁLBUM
  const createAlbum = async () => {
    if (isAdminView || !newAlbumName.trim()) return;
    try {
      const nameUpper = newAlbumName.toUpperCase();
      const docRef = await addDoc(collection(db, "albums"), {
        uid: auth.currentUser.uid,
        name: nameUpper,
        createdAt: serverTimestamp()
      });
      const newAlbum = { id: docRef.id, name: nameUpper };
      setAlbums(prev => [...prev, newAlbum]);
      setActiveAlbum(newAlbum);
      setNewAlbumName("");
      setIsCreatingAlbum(false);
      setMyCards([]);
      showToast("¡Álbum creado!");
    } catch (err) { showToast("Error al crear álbum", "error"); }
  };

  // ACCIONES: GUARDAR WHATSAPP
  const saveWhatsapp = async () => {
    if (isAdminView) return;
    const cleanPhone = whatsapp.toString().replace(/\D/g, '');
    if (cleanPhone.length < 8) return showToast("Número inválido", "error");

    setIsSavingPhone(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        whatsapp: cleanPhone,
        updatedAt: serverTimestamp(),
        displayName: auth.currentUser.displayName || "Entrenador",
        photoURL: auth.currentUser.photoURL || "",
        uid: auth.currentUser.uid
      }, { merge: true });
      showToast("¡WhatsApp vinculado!");
    } catch (err) { showToast("Error al vincular", "error"); }
    finally { setIsSavingPhone(false); }
  };

  // BUSQUEDA TCGDEX
  const searchOfficial = async () => {
    if (isAdminView || !searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.tcgdex.net/v2/es/cards?name=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      const combined = Array.isArray(data) ? data : [];
      setResults(combined.filter(c => c.image).slice(0, 12));
    } catch (err) { console.error(err); }
    setIsSearching(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) searchOfficial();
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // GUARDAR CARTA
  const saveCardToFirestore = async () => {
    if (isAdminView || !activeAlbum) return;
    try {
      const cardPayload = {
        price: Number(cardDetails.price),
        status: cardDetails.status,
        language: cardDetails.language,
        quantity: Number(cardDetails.quantity) || 1,
        delivery: cardDetails.delivery,
        updatedAt: serverTimestamp()
      };

      if (isEditing) {
        await updateDoc(doc(db, "userCollections", selectedCard.id), cardPayload);
      } else {
        await addDoc(collection(db, "userCollections"), {
          ...cardPayload,
          uid: auth.currentUser.uid,
          albumId: activeAlbum.id,
          name: selectedCard.name,
          image: selectedCard.image.includes('high.webp') ? selectedCard.image : `${selectedCard.image}/high.webp`,
          createdAt: serverTimestamp()
        });
      }
      setSelectedCard(null);
      loadMyCollection(auth.currentUser.uid, activeAlbum.id);
      showToast("¡Operación exitosa!");
    } catch (err) { showToast("Error al guardar", "error"); }
  };

  const executeDelete = async () => {
    try {
      await deleteDoc(doc(db, "userCollections", deleteConfirm.id));
      setDeleteConfirm({ show: false, id: null });
      loadMyCollection(targetUid, activeAlbum.id);
      showToast("Carta eliminada", "error");
    } catch (err) { showToast("Error al borrar", "error"); }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  if (loading && !activeAlbum) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-yellow-500" size={48} />
        <p className="text-white font-black uppercase text-xs mt-4 tracking-widest">Cargando Galería...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans bg-fixed bg-cover"
      style={{ backgroundImage: "linear-gradient(to bottom, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0.98)), url('https://i.postimg.cc/DZ8X3nKw/pokemon-card-pictures-7g0mrmm3f22v4c2l.jpg')" }}>

      {isAdminView && (
        <div className="bg-red-600 text-white text-[10px] font-black uppercase py-2 text-center sticky top-0 z-[100] flex items-center justify-center gap-2">
          <ShieldAlert size={14} /> Estás viendo el álbum de otro entrenador (Modo Lectura)
        </div>
      )}

      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-in zoom-in duration-300">
          <div className={`${toast.type === 'success' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'} px-6 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-3 shadow-2xl`}>
            {toast.type === 'success' ? <Sparkles size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </div>
        </div>
      )}

      <header className={`p-4 md:p-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky ${isAdminView ? 'top-8' : 'top-0'} z-50 flex justify-between items-center`}>
        <h2 className="text-2xl font-black italic tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
          POKE<span className="text-yellow-400">ALBUM</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={() => window.open(profileUrl, '_blank')} className="bg-white/5 p-3 rounded-2xl border border-white/10 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-colors">
            <ExternalLink size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-10">

        {/* WHATSAPP */}
        {!isAdminView && (
          <section className="bg-blue-900/10 border border-blue-500/30 rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1">
              <h4 className="font-black uppercase text-sm flex items-center gap-2 text-blue-400"><MessageCircle size={18} /> Contacto WhatsApp</h4>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">Donde te contactarán los compradores</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej: 56912345678"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" />
              <button onClick={saveWhatsapp} disabled={isSavingPhone} className="bg-blue-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase">
                {isSavingPhone ? <Loader2 className="animate-spin" size={16} /> : 'Guardar'}
              </button>
            </div>
          </section>
        )}

        {/* ALBUMS */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><Layers size={16} className="text-yellow-500" /> Álbumes Disponibles</h3>
            {!isAdminView && (
              <button onClick={() => setIsCreatingAlbum(true)} className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                <Plus size={14} /> Nuevo
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {albums.map(album => (
              <button key={album.id}
                onClick={() => { setActiveAlbum(album); loadMyCollection(targetUid, album.id); }}
                className={`flex-shrink-0 px-6 py-4 rounded-2xl border-2 font-black text-[11px] uppercase transition-all flex items-center gap-3 
                ${activeAlbum?.id === album.id ? "bg-yellow-500 border-yellow-400 text-black" : "bg-slate-900 border-white/5 text-slate-500"}`}
              >
                <BookOpen size={16} /> {album.name}
              </button>
            ))}
          </div>
          {isCreatingAlbum && (
            <div className="mt-4 flex gap-2 animate-in slide-in-from-top-2">
              <input autoFocus value={newAlbumName} onChange={(e) => setNewAlbumName(e.target.value)} placeholder="NOMBRE..." className="bg-black/60 border border-yellow-500 rounded-xl px-4 py-2 text-xs font-bold flex-1 max-w-xs" />
              <button onClick={createAlbum} className="bg-green-600 p-3 rounded-xl"><Check size={18} /></button>
              <button onClick={() => setIsCreatingAlbum(false)} className="bg-white/10 p-3 rounded-xl"><X size={18} /></button>
            </div>
          )}
        </section>

        {/* SHARE PANEL */}
        {/* SHARE PANEL */}
        {activeAlbum && (
          <section className="bg-slate-900/80 border border-white/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="bg-white p-3 rounded-3xl">
              {profileUrl && <QRCodeSVG value={profileUrl} size={100} level="H" />}
            </div>
            <div className="flex-1 text-center md:text-left">
              <span className="text-yellow-500 text-[10px] font-black uppercase">Compartir mi colección</span>
              <h3 className="text-2xl font-black uppercase mb-4">{activeAlbum?.name}</h3>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {/* BOTÓN COPIAR LINK ORIGINAL */}
                <button
                  onClick={() => { navigator.clipboard.writeText(profileUrl); setCopied(true); showToast("Link copiado"); }}
                  className="bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar Link'}
                </button>

                {/* NUEVO BOTÓN: COMPARTIR POR WHATSAPP */}
                <button
                  onClick={() => {
                    const message = encodeURIComponent(`¡Hola! Mira mi álbum de cartas Pokémon: ${profileUrl}`);
                    window.open(`https://wa.me/?text=${message}`, '_blank');
                  }}
                  className="bg-[#25D366] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-[#128C7E] transition-colors"
                >
                  <MessageCircle size={16} /> Compartir en WhatsApp
                </button>
              </div>
            </div>
          </section>
        )}

        {/* SEARCH (ONLY OWNER) */}
        {!isAdminView && activeAlbum && (
          <section className="space-y-6">
            <div className="relative max-w-2xl mx-auto">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border-2 border-white/10 rounded-[2rem] py-5 px-14 font-bold outline-none focus:border-yellow-500"
                placeholder="Buscar Pokémon para añadir..." />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={24} />
              {isSearching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-yellow-500" size={20} />}
            </div>

            {results.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 p-4 bg-white/5 rounded-[2rem]">
                {results.map(card => (
                  <div key={card.id} onClick={() => { setIsEditing(false); setSelectedCard(card); }} className="cursor-pointer hover:scale-105 transition-all relative group">
                    <img src={`${card.image}/low.webp`} className="rounded-xl border-2 border-transparent group-hover:border-yellow-500" alt={card.name} />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl">
                      <Plus className="text-white" size={32} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* CARDS GRID */}
        <section className="pt-10 border-t border-white/5">
          <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-8">
            {activeAlbum?.name || 'Inventario'}
            <span className="block text-slate-500 text-xs not-italic font-bold tracking-widest mt-2">{myCards.length} Cartas encontradas</span>
          </h3>

          {myCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {myCards.map(card => (
                <div key={card.id} className="bg-slate-900/60 border border-white/10 rounded-[1.5rem] overflow-hidden group hover:border-yellow-500 transition-all">
                  <div className="relative aspect-[2/3] p-2">
                    <img src={card.image} className="w-full h-full object-contain" alt={card.name} />
                    <div className="absolute bottom-4 right-4 bg-yellow-500 text-black font-black px-2 py-1 rounded-lg text-[10px]">x{card.quantity}</div>

                    {!isAdminView && (
                      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setIsEditing(true); setSelectedCard(card); setCardDetails(card); }} className="bg-yellow-500 p-2 rounded-lg text-black"><Edit3 size={14} /></button>
                        <button onClick={() => setDeleteConfirm({ show: true, id: card.id })} className="bg-red-600 p-2 rounded-lg text-white"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-black/40">
                    <div className="text-lg font-black text-yellow-400">${Number(card.price).toLocaleString('es-CL')}</div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase mt-1 truncate">{card.name}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
              <AlertTriangle className="text-slate-800 mx-auto mb-4" size={48} />
              <p className="font-black uppercase text-slate-600">No hay cartas en este álbum</p>
            </div>
          )}
        </section>
      </main>

      {/* MODAL: ADD / EDIT */}
      {selectedCard && !isAdminView && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-yellow-500 w-full max-w-md rounded-[2.5rem] p-8 space-y-6 animate-in zoom-in duration-300">
            <div className="text-center">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">{isEditing ? 'Editar Carta' : 'Añadir a Álbum'}</h3>
              <p className="text-yellow-500 font-bold text-[10px] uppercase tracking-widest mt-1">{selectedCard.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-black/40 border border-white/10 rounded-2xl p-4">
                <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block text-center">Stock disponible</label>
                <div className="flex items-center justify-center gap-6">
                  <button onClick={() => setCardDetails(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))} className="bg-white/5 p-3 rounded-xl"><Minus size={20} /></button>
                  <span className="text-3xl font-black text-white">{cardDetails.quantity}</span>
                  <button onClick={() => setCardDetails(prev => ({ ...prev, quantity: prev.quantity + 1 }))} className="bg-yellow-500 text-black p-3 rounded-xl"><Plus size={20} /></button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Precio (CLP)</label>
                <input type="number" value={cardDetails.price} onChange={(e) => setCardDetails({ ...cardDetails, price: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-black text-yellow-400 text-xl outline-none" placeholder="0" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Estado</label>
                <select value={cardDetails.status} onChange={(e) => setCardDetails({ ...cardDetails, status: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none">
                  <option>Near Mint</option><option>Lightly Played</option><option>Played</option><option>Damaged</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Idioma</label>
                <select value={cardDetails.language} onChange={(e) => setCardDetails({ ...cardDetails, language: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none">
                  <option>Inglés</option><option>Español</option><option>Japonés</option>
                </select>
              </div>
            </div>
            <button onClick={saveCardToFirestore} className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform">
              {isEditing ? 'Guardar Cambios' : 'Confirmar'}
            </button>
            <button onClick={() => setSelectedCard(null)} className="w-full text-slate-500 font-bold text-[10px] uppercase">Cancelar</button>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-900 border border-red-500/50 p-10 rounded-[3rem] text-center max-w-xs w-full shadow-2xl">
            <Trash2 className="text-red-500 mx-auto mb-6" size={48} />
            <h4 className="font-black uppercase mb-6 text-white">¿Borrar esta carta?</h4>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm({ show: false, id: null })} className="flex-1 bg-white/5 py-4 rounded-2xl font-black text-[10px] uppercase">No</button>
              <button onClick={executeDelete} className="flex-1 bg-red-600 py-4 rounded-2xl font-black text-[10px] uppercase">Sí, Borrar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap');
        h1, h2, h3, h4, button, span, label, input, select { font-family: 'Archivo Black', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}