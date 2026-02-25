import React, { useState } from 'react';
import { X, Save, Tag, AlignLeft, DollarSign } from 'lucide-react';

export default function AddCardModal({ card, isOpen, onClose, onSave }) {
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [rarity, setRarity] = useState(card?.rarity || "");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <h3 className="font-black uppercase italic tracking-tighter text-white">Añadir a mi Colección</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex gap-4 items-center mb-4">
            {/* OPTIMIZACIÓN: Imagen con decoding async y loading eager para prioridad en modal */}
            <div className="w-20 h-28 bg-black/20 rounded-lg flex-shrink-0 overflow-hidden">
              <img 
                src={`${card.image}/low.webp`} 
                className="w-full h-full object-contain shadow-lg" 
                alt="Preview" 
                loading="eager"
                decoding="async"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">{card.set.name}</p>
              <h4 className="font-black text-xl leading-none uppercase italic text-white">{card.name}</h4>
              <p className="text-slate-500 text-[10px] mt-1 font-mono">{card.id}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* PRECIO PERSONALIZADO */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-1 block">Tu Precio (USD/EUR)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-10 text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-700" 
                  placeholder="0.00"
                />
                <DollarSign className="absolute left-3 top-3.5 text-slate-600" size={16} />
              </div>
            </div>

            {/* ESTADO/RAREZA */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-1 block">Estado / Rareza Custom</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-10 text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-700" 
                  placeholder="Ej: Mint, PSA 10, Holo..."
                />
                <Tag className="absolute left-3 top-3.5 text-slate-600" size={16} />
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-1 block">Descripción</label>
              <div className="relative">
                <textarea 
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-10 text-white outline-none focus:border-blue-500 transition-all min-h-[80px] placeholder:text-slate-700 resize-none" 
                  placeholder="Cuéntanos algo de esta carta..."
                />
                <AlignLeft className="absolute left-3 top-3.5 text-slate-600" size={16} />
              </div>
            </div>
          </div>

          <button 
            onClick={() => onSave({ price, desc, rarity })}
            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black uppercase text-sm tracking-widest text-white shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Save size={18} /> Guardar en mi Álbum
          </button>
        </div>
      </div>
    </div>
  );
}