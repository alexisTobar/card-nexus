import React from 'react';
import { Layers, Plus, BookOpen, Check, X } from 'lucide-react';

export default function AlbumTabs({ 
  albums, activeAlbum, setActiveAlbum, loadMyCollection, 
  isAdminView, setIsCreatingAlbum, isCreatingAlbum, 
  newAlbumName, setNewAlbumName, createAlbum, targetUid 
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
          <Layers size={16} className="text-yellow-500" /> Álbumes Disponibles
        </h3>
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
          <button onClick={createAlbum} className="bg-green-600 p-3 rounded-xl"><Check size={18}/></button>
          <button onClick={() => setIsCreatingAlbum(false)} className="bg-white/10 p-3 rounded-xl"><X size={18}/></button>
        </div>
      )}
    </section>
  );
}