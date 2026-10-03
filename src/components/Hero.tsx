import React from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  ArrowRight, 
  Music, 
  Cake, 
  Crown, 
  Flame, 
  MapPin, 
  Phone, 
  Radio
} from 'lucide-react';
import { SystemConfig } from '../types';

interface HeroProps {
  onOrderNow: () => void;
  onNavigateSection: (sectionId: string, interactiveTab?: 'dj_request' | 'birthday_bar' | 'vip_matrix') => void;
  activeTicker: string;
  config?: SystemConfig;
}

export const Hero: React.FC<HeroProps> = ({ 
  onOrderNow, 
  onNavigateSection, 
  activeTicker,
  config
}) => {
  const hotline = config?.venue_contacts.hotline || '+260 979 181461';
  return (
    <section id="hero-section" className="relative overflow-hidden bg-[#050608] text-white pt-6 pb-12">
      
      {/* Background Ambience: Subtle Amber/Burgundy Glow from Screenshot 1 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-96 bg-gradient-to-b from-amber-600/15 via-red-950/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Live DJ Ribbon */}
      <div className="max-w-md mx-auto px-4 mb-4">
        <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full overflow-hidden flex items-center shadow-lg">
          <div className="flex items-center space-x-1.5 shrink-0 pr-2.5 border-r border-amber-500/30 text-amber-400 text-[10px] font-black tracking-wider uppercase">
            <Radio className="w-3 h-3 animate-pulse text-red-500" />
            <span>LIVE</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap w-full pl-2.5">
            <div className="inline-block animate-marquee text-[11px] font-semibold text-amber-200 tracking-wide">
              {activeTicker}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md sm:max-w-xl mx-auto px-4 text-center">
        
        {/* Top Capsule Pill: "Kabwe's #1 Premier Nightclub & VIP Lounge • DOORS OPEN" */}
        <div className="inline-flex items-center justify-between gap-3 bg-gradient-to-r from-amber-950/60 via-black/80 to-amber-950/60 border border-amber-600/40 px-3.5 py-1.5 rounded-full text-xs shadow-xl mb-6">
          <div className="flex items-center space-x-1.5 text-amber-300 font-semibold text-[11px] sm:text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Kabwe's #1 Premier Nightclub & VIP Lounge</span>
          </div>
          <div className="flex items-center space-x-1.5 text-emerald-400 font-black text-[10px] sm:text-[11px] tracking-wider uppercase border-l border-amber-500/30 pl-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>DOORS OPEN</span>
          </div>
        </div>

        {/* Master Serif Display Headline from Screenshot 1 */}
        <h1 className="font-serif-display text-3xl sm:text-5xl font-black tracking-wide leading-tight sm:leading-none uppercase">
          <span className="block text-white">
            ELEVATE YOUR
          </span>
          <span className="block text-white mt-1">
            NIGHT AT PHOENIX
          </span>
          <span className="block text-amber-400 mt-1 drop-shadow-sm">
            LOUNGE
          </span>
        </h1>

        {/* Subtitle from Screenshot 1 */}
        <p className="mt-4 text-xs sm:text-sm text-gray-300 leading-relaxed font-medium max-w-lg mx-auto">
          Sip ice-cold Mosi & handcrafted cocktails, savor authentic flame-grilled braii, and request live songs directly to our resident DJs.
        </p>

        {/* Big Vibrant Rounded Pill CTA Button from Screenshot 1 */}
        <div className="mt-6">
          <button
            onClick={onOrderNow}
            className="w-full sm:w-auto sm:px-12 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-base flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/25 transition-all transform active:scale-98"
          >
            <ShoppingBag className="w-5 h-5 text-black" />
            <span>Order Now</span>
            <ArrowRight className="w-5 h-5 text-black ml-1" />
          </button>
        </div>

        {/* 2x2 Quick Action Cards Grid from Screenshot 1 */}
        <div className="mt-8 grid grid-cols-2 gap-3 text-left">
          
          {/* Card 1: DJ CONSOLE - DJ Song Request */}
          <div 
            onClick={() => onNavigateSection('dj-requests-section', 'dj_request')}
            className="p-3.5 rounded-2xl bg-gradient-to-b from-purple-950/40 to-[#0e0918] border border-purple-800/40 hover:border-purple-500/70 transition-all cursor-pointer shadow-lg group active:scale-98"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold tracking-wider text-purple-300 uppercase">
                DJ CONSOLE
              </span>
              <div className="w-6 h-6 rounded-lg bg-purple-600/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Music className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-200">
              DJ Song Request
            </h4>
            <p className="text-[11px] text-purple-300/80 mt-0.5 font-medium">
              Direct to Decks →
            </p>
          </div>

          {/* Card 2: SHOUTOUTS - Birthday Wishing */}
          <div 
            onClick={() => onNavigateSection('birthday-bar-section', 'birthday_bar')}
            className="p-3.5 rounded-2xl bg-gradient-to-b from-pink-950/40 to-[#180911] border border-pink-800/40 hover:border-pink-500/70 transition-all cursor-pointer shadow-lg group active:scale-98"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold tracking-wider text-pink-300 uppercase">
                SHOUTOUTS
              </span>
              <div className="w-6 h-6 rounded-lg bg-pink-600/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                <Cake className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-200">
              Birthday Wishing
            </h4>
            <p className="text-[11px] text-pink-300/80 mt-0.5 font-medium">
              Live Shoutouts →
            </p>
          </div>

          {/* Card 3: VIP TABLES - VIP Reservation */}
          <div 
            onClick={() => onNavigateSection('vip-booths-section', 'vip_matrix')}
            className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-950/40 to-[#160f06] border border-amber-600/40 hover:border-amber-400 transition-all cursor-pointer shadow-lg group active:scale-98"
          >
            <div className="flex items-center space-x-1.5 mb-2">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-extrabold tracking-wider text-amber-300 uppercase">
                VIP TABLES
              </span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-bold">
                20-min hold
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-200">
              VIP Reservation
            </h4>
            <div className="mt-1.5">
              <a 
                href={`tel:${hotline.replace(/\s+/g, '')}`} 
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/60 border border-amber-600/50 text-[10px] font-bold text-amber-300 hover:text-white"
              >
                <Phone className="w-2.5 h-2.5 text-emerald-400" />
                <span>{hotline}</span>
              </a>
            </div>
          </div>

          {/* Card 4: TONIGHT'S VIBE */}
          <div 
            onClick={() => onNavigateSection('promotions-section')}
            className="p-3.5 rounded-2xl bg-gradient-to-b from-gray-900 to-[#0c0d12] border border-gray-800 hover:border-amber-500/40 transition-all cursor-pointer shadow-lg group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold tracking-wider text-gray-400 uppercase">
                TONIGHT'S VIBE
              </span>
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
              </div>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-200 truncate">
              Afrobeats, Amapiano ...
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 truncate">
              <MapPin className="w-2.5 h-2.5 text-red-500 shrink-0" />
              <span>12 Freedom Way, Kabw...</span>
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
