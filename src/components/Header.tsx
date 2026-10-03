import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  Crown, 
  Cake, 
  Music, 
  FileText, 
  Image as ImageIcon, 
  ShieldCheck, 
  Radio, 
  ChevronRight, 
  Flame, 
  Phone,
  Sparkles,
  LogOut,
  Sliders
} from 'lucide-react';
import { SystemConfig } from '../types';

interface HeaderProps {
  config: SystemConfig;
  cartCount: number;
  cartTotal: number;
  currentRole?: 'client' | 'staff' | 'dj';
  onLogout?: () => void;
  onOpenCart: () => void;
  onOpenManagement: (portal?: 'staff' | 'dj') => void;
  onNavigateSection: (sectionId: string) => void;
  onOpenOrdersModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  cartCount,
  cartTotal,
  currentRole = 'client',
  onLogout,
  onOpenCart,
  onOpenManagement,
  onNavigateSection,
  onOpenOrdersModal
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleAction = (callback: () => void) => {
    setDrawerOpen(false);
    callback();
  };

  const isStaffOrDJ = currentRole === 'staff' || currentRole === 'dj';

  return (
    <>
      {/* Top Sticky Header matching Screenshot 1 */}
      <header className="sticky top-0 z-40 bg-[#07090e]/95 backdrop-blur-md border-b border-amber-500/20 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Left Brand Identity: Phoenix Shield + PHOENIX LOUNGE + [KABWE] pill + subtitle */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigateSection('hero-section')}>
            {/* Phoenix Emblem: Golden bird/flame in rounded golden-bordered square */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600/30 via-red-900/40 to-black border-2 border-amber-500/60 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-amber-400" fill="currentColor">
                <path d="M12 2C9.5 5 7 8 7 11.5c0 2.2 1.2 4.1 3 5.2-.5-1.2-.5-2.7.2-4.2.8 1.8 2.2 3.1 3.8 3.5 1.5-.4 2.9-1.7 3.8-3.5.7 1.5.7 3-.2 4.2 1.8-1.1 3-3 3-5.2C20.6 8 18.1 5 15.6 2c-.9 2.5-2.2 4.2-3.6 4.2S9.3 4.5 12 2z"/>
                <path d="M12 14c-1.1 0-2 .9-2 2s1.5 3 2 4c.5-1 2-2.9 2-4s-.9-2-2-2z" fill="#f59e0b"/>
              </svg>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif-display font-black text-lg sm:text-xl tracking-wider text-amber-400">
                  PHOENIX LOUNGE
                </span>
                <span className="border border-amber-600/70 bg-amber-950/40 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded tracking-widest font-mono">
                  KABWE
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-400 tracking-wide">
                Premier VIP Lounge & Nightclub • 12 Freedom Way
              </p>
            </div>
          </div>

          {/* Right Action: Cart + Active Session Badge + Circular Donut Hamburger Menu Button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Quick Persistent Staff / DJ Portal Button if logged in */}
            {isStaffOrDJ && (
              <button
                onClick={() => onOpenManagement(currentRole as 'staff' | 'dj')}
                className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all ${
                  currentRole === 'staff' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30' 
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{currentRole === 'staff' ? 'Staff Command Hub' : 'DJ Deck'}</span>
              </button>
            )}

            {/* Quick Cart Trigger */}
            {cartCount > 0 && (
              <button
                onClick={onOpenCart}
                className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{cartCount}</span>
              </button>
            )}

            {/* Circular Donut Hamburger Button from Screenshot 1 */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-11 h-11 rounded-full border-2 border-amber-500/60 hover:border-amber-400 bg-black/60 flex items-center justify-center text-amber-400 hover:text-amber-300 transition-all shadow-lg shadow-amber-500/10 focus:outline-none"
              aria-label="Open Navigation Drawer"
            >
              <div className="w-8 h-8 rounded-full border border-amber-500/40 flex flex-col items-center justify-center space-y-1">
                <span className="w-4 h-0.5 bg-amber-400 rounded-full"></span>
                <span className="w-4 h-0.5 bg-amber-400 rounded-full"></span>
                <span className="w-4 h-0.5 bg-amber-400 rounded-full"></span>
              </div>
            </button>
          </div>

        </div>
      </header>

      {/* Slide-over Navigation Drawer matching Screenshot 2 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setDrawerOpen(false)} />

          <div className="relative w-full max-w-md bg-[#090b10] border-l border-gray-800 text-white h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl z-10">
            
            <div>
              {/* Drawer Top Row: Title + Close Icon */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-5">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif-display font-black text-amber-400 text-base">
                      PHOENIX LOUNGE
                    </h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                      QUICK DIRECTORY
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-900 border border-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Logged in notification banner inside drawer */}
              {isStaffOrDJ && (
                <div className="mb-5 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-amber-300">
                        Logged in as {currentRole === 'staff' ? 'Staff / Manager' : 'DJ Operator'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Session stays active until you press Log Out
                      </p>
                    </div>
                  </div>
                  {onLogout && (
                    <button
                      onClick={() => handleAction(onLogout)}
                      className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 text-[11px] font-black rounded-lg border border-red-500/40 flex items-center space-x-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Log Out</span>
                    </button>
                  )}
                </div>
              )}

              {/* 6 Category Action Buttons matching Screenshot 2 */}
              <div className="space-y-2.5">
                
                {/* 1. Drinks & Bottle Service */}
                <button
                  onClick={() => handleAction(() => onNavigateSection('menu-section'))}
                  className="w-full p-3.5 rounded-2xl bg-gray-900/90 hover:bg-gray-800/90 border border-gray-800 hover:border-amber-500/40 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-200">
                        Drinks & Bottle Service
                      </h4>
                      <p className="text-xs text-gray-400">
                        Whisky, Cognac, Champagne, Mosi Buckets
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </button>

                {/* 2. VIP Booths & Table Reservations */}
                <button
                  onClick={() => handleAction(() => onNavigateSection('vip-section'))}
                  className="w-full p-3.5 rounded-2xl bg-gray-900/90 hover:bg-gray-800/90 border border-gray-800 hover:border-amber-500/40 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-600/50 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-200">
                        VIP Booths & Table Reservations
                      </h4>
                      <p className="text-xs text-gray-400">
                        Reserve luxury booths with instant hold
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </button>

                {/* 3. Birthday Wishing & Shoutouts */}
                <button
                  onClick={() => handleAction(() => onNavigateSection('birthday-section'))}
                  className="w-full p-3.5 rounded-2xl bg-gray-900/90 hover:bg-gray-800/90 border border-gray-800 hover:border-pink-500/40 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform">
                      <Cake className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-pink-200">
                        Birthday Wishing & Shoutouts
                      </h4>
                      <p className="text-xs text-gray-400">
                        Post birthday greetings to DJ & live screen
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-pink-400" />
                </button>

                {/* 4. DJ Live Song Requests */}
                <button
                  onClick={() => handleAction(() => onNavigateSection('dj-requests-section'))}
                  className="w-full p-3.5 rounded-2xl bg-gray-900/90 hover:bg-gray-800/90 border border-gray-800 hover:border-purple-500/40 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-purple-200">
                        DJ Live Song Requests
                      </h4>
                      <p className="text-xs text-gray-400">
                        Request your track directly to the DJ
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
                </button>

                {/* 5. My Orders & Download Receipts */}
                <button
                  onClick={() => handleAction(() => onOpenOrdersModal())}
                  className="w-full p-3.5 rounded-2xl bg-gray-900/90 hover:bg-gray-800/90 border border-gray-800 hover:border-emerald-500/40 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-200">
                        My Orders & Download Receipts
                      </h4>
                      <p className="text-xs text-gray-400">
                        Check pending status, items & download PNG
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" />
                </button>

                {/* 6. All-Time Table of the Night */}
                <button
                  onClick={() => handleAction(() => onNavigateSection('table-night-section'))}
                  className="w-full p-3.5 rounded-2xl bg-gray-900/90 hover:bg-gray-800/90 border border-gray-800 hover:border-amber-500/40 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-200">
                        All-Time Table of the Night
                      </h4>
                      <p className="text-xs text-gray-400">
                        Full archive of past & current VIP spotlights
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition-colors" />
                </button>

              </div>

              {/* MANAGEMENT BAR Divider & 2 Bottom Cards matching Screenshot 2 */}
              <div className="mt-6 pt-5 border-t border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>MANAGEMENT BAR</span>
                  </div>
                  {isStaffOrDJ && onLogout && (
                    <button
                      onClick={() => handleAction(onLogout)}
                      className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center space-x-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Staff Login / Staff Hub */}
                  <button
                    onClick={() => handleAction(() => onOpenManagement('staff'))}
                    className={`p-3 rounded-2xl border text-left transition-all group ${
                      currentRole === 'staff'
                        ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/30'
                        : 'bg-gray-900 border-gray-800 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 text-amber-400 mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="font-bold text-xs text-white">
                        {currentRole === 'staff' ? 'Staff Hub (Active)' : 'Staff Login'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      Orders, menu categories & inventory
                    </p>
                  </button>

                  {/* DJ Decks */}
                  <button
                    onClick={() => handleAction(() => onOpenManagement('dj'))}
                    className={`p-3 rounded-2xl border text-left transition-all group ${
                      currentRole === 'dj'
                        ? 'bg-purple-950/40 border-purple-500/60 ring-1 ring-purple-500/30'
                        : 'bg-gray-900 border-gray-800 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 text-purple-400 mb-1">
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span className="font-bold text-xs text-white">
                        {currentRole === 'dj' ? 'DJ Deck (Active)' : 'DJ Decks'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      Live song queue & sound drops
                    </p>
                  </button>
                </div>
              </div>

            </div>

            {/* Hotline & Hours Footer */}
            <div className="mt-8 pt-4 border-t border-gray-800/80 text-center">
              <p className="text-xs text-amber-400 font-semibold flex items-center justify-center space-x-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{config.venue_contacts.hotline}</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {config.venue_contacts.address}
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
