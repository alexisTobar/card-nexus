import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function TcgCard({ card }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-white/10 shadow-2xl transition-all group-hover:border-blue-500/50">
        <img
          src={`${card.image}/low.webp`}
          alt={card.name}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-auto transition-transform duration-500 group-hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {!isLoaded && <div className="aspect-[2/3] w-full bg-slate-800 animate-pulse" />}
        
        {/* Etiqueta de Rareza flotante */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-[8px] px-2 py-0.5 rounded-full border border-white/10 text-blue-400 font-bold uppercase">
          {card.rarity || 'Promo'}
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-[11px] font-black text-white truncate uppercase tracking-tighter">
          {card.name}
        </h3>
        {/* Mostramos el Set para diferenciar las ediciones */}
        <p className="text-[9px] text-slate-500 font-bold truncate mt-0.5 flex items-center gap-1">
          <span className="text-blue-600">●</span> {card.set.name}
        </p>
        <p className="text-[9px] text-slate-600 mt-0.5">#{card.localId} / {card.set.cardCount.official}</p>
      </div>
    </motion.div>
  );
}