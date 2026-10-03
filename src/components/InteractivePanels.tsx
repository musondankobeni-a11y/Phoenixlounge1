import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Cake, 
  Grid, 
  ShieldCheck, 
  Lock, 
  Send, 
  Check, 
  Users, 
  AlertCircle, 
  Sparkles, 
  PhoneCall, 
  Clock, 
  Calendar, 
  Flame, 
  Download, 
  Share2, 
  Crown,
  Copy,
  Phone,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { VIPBooth, PaymentGateway, DJBirthdayShoutout, DJSongRequest, SystemConfig } from '../types';

interface InteractivePanelsProps {
  isOpen: boolean;
  onClose: () => void;
  booths: VIPBooth[];
  config?: SystemConfig;
  shoutouts?: DJBirthdayShoutout[];
  requests?: DJSongRequest[];
  currentTab?: 'dj_request' | 'birthday_bar' | 'vip_matrix';
  onLockBooth: (boothCode: string, name: string, phone: string, paymentMethod: PaymentGateway) => void;
  onSubmitDJRequest: (data: {
    customer_name: string;
    booth_table: string;
    song_title: string;
    artist: string;
    personal_note?: string;
  }) => void;
  onSubmitBirthdayShoutout: (data: {
    celebrant_name: string;
    booth_number: string;
    customized_text: string;
    song_selection: string;
    package_type?: 'standard' | 'sparkler_vip' | 'champagne_fanfare';
  }) => void;
}

export const InteractivePanels: React.FC<InteractivePanelsProps> = ({
  isOpen,
  onClose,
  booths,
  config,
  shoutouts = [],
  requests = [],
  currentTab,
  onLockBooth,
  onSubmitDJRequest,
  onSubmitBirthdayShoutout,
}) => {
  const [activeTab, setActiveTab] = useState<'dj_request' | 'birthday_bar' | 'vip_matrix'>(
    currentTab || 'vip_matrix'
  );

  const hotline = config?.venue_contacts.hotline || '+260 979 181461';
  const whatsappNumber = config?.venue_contacts.whatsapp || hotline;

  useEffect(() => {
    if (currentTab) {
      setActiveTab(currentTab);
    }
  }, [currentTab]);

  // Web Audio chime synthesizer (zero external dependencies, 100% reliable)
  const playSound = (type: 'dj' | 'birthday' | 'vip') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      if (type === 'dj') {
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.09);
          gain.gain.setValueAtTime(0.12, now + i * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.09);
          osc.stop(now + i * 0.09 + 0.3);
        });
      } else if (type === 'birthday') {
        [392.00, 523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.15, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.4);
        });
      } else {
        [440, 554.37, 659.25].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
        });
      }
    } catch {
      // Ignore audio failure
    }
  };

  // Live timer tick for 20-min booth holds
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Song Request State
  const [djName, setDjName] = useState('');
  const [djBooth, setDjBooth] = useState('');
  const [djSong, setDjSong] = useState('');
  const [djArtist, setDjArtist] = useState('');
  const [djGenre, setDjGenre] = useState('Amapiano');
  const [djNote, setDjNote] = useState('');
  const [djSentCode, setDjSentCode] = useState<string | null>(null);

  // Birthday State
  const [bdayName, setBdayName] = useState('');
  const [bdayBooth, setBdayBooth] = useState('');
  const [bdayMsg, setBdayMsg] = useState('');
  const [bdaySong, setBdaySong] = useState('');
  const [bdayPackage, setBdayPackage] = useState<'standard' | 'sparkler_vip' | 'champagne_fanfare'>('sparkler_vip');
  const [bdayConfirmation, setBdayConfirmation] = useState<{ id: string; name: string } | null>(null);

  // VIP Booth Reservation Modal State
  const [selectedBooth, setSelectedBooth] = useState<VIPBooth | null>(null);
  const [vipReserverName, setVipReserverName] = useState('');
  const [vipReserverPhone, setVipReserverPhone] = useState('');
  const [vipGuests, setVipGuests] = useState('4');
  const [vipPayment, setVipPayment] = useState<PaymentGateway>('mtn');
  const [reservationVoucher, setReservationVoucher] = useState<{
    code: string;
    booth: string;
    name: string;
    expiresIn: string;
  } | null>(null);
  const [voucherCopied, setVoucherCopied] = useState(false);

  // Compute remaining time for 20-min hold
  const getHoldRemainingText = (expiresAt?: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return 'Hold Expired';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s hold remaining`;
  };

  // Handle DJ submit
  const handleDJSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!djSong.trim() || !djArtist.trim() || !djBooth.trim()) return;
    const code = `DJR-${Math.floor(1000 + Math.random() * 9000)}`;
    onSubmitDJRequest({
      customer_name: djName.trim() || 'Lounge Guest',
      booth_table: djBooth.trim(),
      song_title: djSong.trim(),
      artist: djArtist.trim(),
      personal_note: djNote.trim() ? `[${djGenre}] ${djNote.trim()}` : `[${djGenre}]`,
    });
    playSound('dj');
    setDjSentCode(code);
    setDjSong('');
    setDjArtist('');
    setDjNote('');
  };

  // Handle Birthday submit
  const handleBirthdaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bdayName.trim() || !bdayBooth.trim() || !bdayMsg.trim()) return;
    const shoutId = `BDAY-${Math.floor(1000 + Math.random() * 9000)}`;
    onSubmitBirthdayShoutout({
      celebrant_name: bdayName.trim(),
      booth_number: bdayBooth.trim(),
      customized_text: bdayMsg.trim(),
      song_selection: bdaySong.trim() || 'Club Birthday Fanfare',
      package_type: bdayPackage,
    });
    playSound('birthday');
    setBdayConfirmation({ id: shoutId, name: bdayName.trim() });
    setBdayName('');
    setBdayMsg('');
    setBdaySong('');
  };

  // Handle Booth Lock
  const handleLockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooth || !vipReserverName.trim() || !vipReserverPhone.trim()) return;
    onLockBooth(selectedBooth.booth_code, vipReserverName.trim(), vipReserverPhone.trim(), vipPayment);
    playSound('vip');
    const voucherCode = `VIP-${selectedBooth.booth_code}-${Math.floor(1000 + Math.random() * 9000)}`;
    setReservationVoucher({
      code: voucherCode,
      booth: `${selectedBooth.name} (${selectedBooth.booth_code})`,
      name: vipReserverName.trim(),
      expiresIn: '20 minutes'
    });
    setSelectedBooth(null);
  };

  const reservedCount = booths.filter(b => b.is_reserved).length;
  const availableCount = booths.length - reservedCount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#090c13] border border-amber-500/40 rounded-3xl shadow-2xl p-5 sm:p-7 relative my-auto max-h-[92vh] flex flex-col overflow-hidden text-white">
        
        {/* Modal Top Header with Title, Tabs and Close Button */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 shrink-0">
          <div>
            <div className="inline-flex items-center space-x-1.5 border border-amber-600/40 bg-amber-950/20 text-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>LIVE GUEST SERVICES</span>
            </div>
            <h2 className="font-serif-display text-lg sm:text-2xl font-black uppercase tracking-tight">
              {activeTab === 'vip_matrix' && 'VIP Booth Matrix & 20-Min Hold'}
              {activeTab === 'birthday_bar' && 'Live Birthday Bar Shoutout'}
              {activeTab === 'dj_request' && 'DJ Console Song Request'}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {/* Desktop Tab Switcher */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => setActiveTab('vip_matrix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'vip_matrix'
                    ? 'bg-amber-500 text-black font-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                VIP Tables ({availableCount})
              </button>
              <button
                onClick={() => setActiveTab('birthday_bar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'birthday_bar'
                    ? 'bg-pink-600 text-white font-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Birthday Shoutout
              </button>
              <button
                onClick={() => setActiveTab('dj_request')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'dj_request'
                    ? 'bg-purple-600 text-white font-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                DJ Song Request
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mobile Tab Selector */}
        <div className="sm:hidden flex items-center space-x-1.5 py-2.5 overflow-x-auto custom-scrollbar border-b border-gray-800/80 shrink-0">
          <button
            onClick={() => setActiveTab('vip_matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'vip_matrix' ? 'bg-amber-500 text-black font-black' : 'bg-gray-950 text-gray-400 border border-gray-800'
            }`}
          >
            VIP Tables ({availableCount})
          </button>
          <button
            onClick={() => setActiveTab('birthday_bar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'birthday_bar' ? 'bg-pink-600 text-white font-black' : 'bg-gray-950 text-gray-400 border border-gray-800'
            }`}
          >
            Birthday Shoutout
          </button>
          <button
            onClick={() => setActiveTab('dj_request')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'dj_request' ? 'bg-purple-600 text-white font-black' : 'bg-gray-950 text-gray-400 border border-gray-800'
            }`}
          >
            DJ Request
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-4">

        {/* =======================================================================
            TAB 1: WORKING VIP BOOTH MATRIX & 20-MIN HOLD BAR
           ======================================================================= */}
        {activeTab === 'vip_matrix' && (
          <div id="vip-booths-section" className="space-y-5">
            
            {/* Real-time Status Banner */}
            <div className="p-4 bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Total VIP Suites: <strong className="text-white font-mono">{booths.length}</strong></span>
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <strong>{availableCount} Available Now</strong>
                </span>
                <span className="text-gray-500">Reserved: <strong className="text-gray-400 font-mono">{reservedCount}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-amber-300 font-semibold text-[11px]">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Automated 20-minute reservation hold guarantee</span>
              </div>
            </div>

            {/* Reservation Voucher confirmation banner */}
            {reservationVoucher && (
              <div className="p-5 bg-gradient-to-r from-amber-950/90 via-black to-amber-950/90 border-2 border-amber-500 rounded-3xl text-white shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-black uppercase text-amber-400 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>20-Minute Hold Confirmed!</span>
                  </div>
                  <h4 className="text-base font-black text-white">{reservationVoucher.booth}</h4>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Reserved for <strong className="text-white">{reservationVoucher.name}</strong> • Voucher Ref: <span className="font-mono text-amber-300 font-bold">{reservationVoucher.code}</span>
                  </p>
                  <p className="text-[11px] text-amber-300/90 mt-1 font-mono">
                    Hold duration: 20 minutes from booking. Please check in with VIP security or call {hotline}.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`PHOENIX LOUNGE VIP VOUCHER: ${reservationVoucher.code} | Booth: ${reservationVoucher.booth} | Guest: ${reservationVoucher.name}`);
                      setVoucherCopied(true);
                      setTimeout(() => setVoucherCopied(false), 2500);
                    }}
                    className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl flex items-center space-x-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{voucherCopied ? 'Copied!' : 'Copy Pass'}</span>
                  </button>
                  <a
                    href={`tel:${hotline.replace(/\s+/g, '')}`}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call VIP Host</span>
                  </a>
                  <button
                    onClick={() => setReservationVoucher(null)}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Booths Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {booths.map(booth => {
                const holdText = getHoldRemainingText(booth.hold_expires_at);

                return (
                  <div
                    key={booth.booth_code}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      booth.is_reserved
                        ? 'bg-gray-950/80 border-gray-800 opacity-75'
                        : 'bg-gray-900/90 border-gray-800 hover:border-amber-500/50 shadow-xl'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                          {booth.booth_code}
                        </span>
                        {booth.tier === 'vvip_presidential' ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                            VVIP Presidential
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded">
                            VIP Reserve
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif-display text-lg font-black text-white">
                        {booth.name}
                      </h3>

                      <div className="mt-2.5 space-y-1 text-xs text-gray-400">
                        <div className="flex items-center space-x-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-500" />
                          <span>Capacity: {booth.capacity} VIP Guests</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-amber-400 font-bold font-mono">Min Spend: ZMW {booth.min_spend.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Live 20-min countdown indicator */}
                      {booth.is_reserved && holdText && (
                        <div className="mt-3 p-2 bg-amber-950/40 border border-amber-600/40 rounded-lg text-[11px] text-amber-300 font-mono flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                          <span>{holdText}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-800/80">
                      {booth.is_reserved ? (
                        <div className="w-full py-2.5 rounded-xl bg-gray-800/80 text-gray-400 text-center text-xs font-black tracking-wider uppercase flex items-center justify-center space-x-2">
                          <Lock className="w-3.5 h-3.5" />
                          <span>[TAKEN / ON HOLD]</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedBooth(booth)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-black tracking-wide uppercase transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>Book with 20-Min Hold</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* =======================================================================
            TAB 2: WORKING BIRTHDAY SHOUTOUT MENU
           ======================================================================= */}
        {activeTab === 'birthday_bar' && (
          <div id="birthday-bar-section" className="max-w-3xl mx-auto space-y-6">
            
            <div className="bg-gradient-to-b from-[#180911] via-gray-950 to-black border border-pink-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="mb-6 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400">
                  <Cake className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">
                    Celebration Broadcast Console
                  </span>
                  <h3 className="font-serif-display text-xl sm:text-2xl font-black text-white">
                    Live Birthday Bar Shoutout
                  </h3>
                </div>
              </div>

              {bdayConfirmation && (
                <div className="mb-6 p-4 bg-pink-950/80 border-2 border-pink-500 rounded-2xl text-pink-200 text-xs flex items-start space-x-3 animate-in fade-in">
                  <Sparkles className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-sm">Celebration Queued for {bdayConfirmation.name}!</h4>
                    <p className="mt-1 text-pink-300">
                      Ref ID: <strong className="font-mono text-white">{bdayConfirmation.id}</strong>. The resident DJ will broadcast your message across the lounge and sound system.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleBirthdaySubmit} className="space-y-4 text-xs">
                
                {/* Package Type Selector */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1.5">
                    Celebration Experience Package
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setBdayPackage('standard')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        bdayPackage === 'standard'
                          ? 'border-pink-500 bg-pink-950/50 text-white font-bold'
                          : 'border-gray-800 bg-gray-900/60 text-gray-400'
                      }`}
                    >
                      <p className="font-bold text-xs text-white">Standard Shoutout</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">DJ Mic announcement + Toast track</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBdayPackage('sparkler_vip')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        bdayPackage === 'sparkler_vip'
                          ? 'border-pink-500 bg-pink-950/50 text-white font-bold ring-1 ring-pink-500/50'
                          : 'border-gray-800 bg-gray-900/60 text-gray-400'
                      }`}
                    >
                      <p className="font-bold text-xs text-pink-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>VIP Sparkler Toast</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Sparkler presentation to booth</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBdayPackage('champagne_fanfare')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        bdayPackage === 'champagne_fanfare'
                          ? 'border-pink-500 bg-pink-950/50 text-white font-bold'
                          : 'border-gray-800 bg-gray-900/60 text-gray-400'
                      }`}
                    >
                      <p className="font-bold text-xs text-amber-300">Champagne Fanfare</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Lounge screen visuals & spotlight</p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Celebrant Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mulenga Mwape"
                      value={bdayName}
                      onChange={(e) => setBdayName(e.target.value)}
                      className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-pink-500 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Booth or Table Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VIP V03 / Table 12"
                      value={bdayBooth}
                      onChange={(e) => setBdayBooth(e.target.value)}
                      className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-pink-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Customized Birthday Message *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Wishing a huge Happy 25th Birthday to Mulenga! More blessings, health, and champagne from the entire squad!"
                    value={bdayMsg}
                    onChange={(e) => setBdayMsg(e.target.value)}
                    className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-pink-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Toast Anthem / Preferred Track</label>
                  <input
                    type="text"
                    placeholder="e.g. Master KG - Jerusalema, or Burna Boy - City Boys"
                    value={bdaySong}
                    onChange={(e) => setBdaySong(e.target.value)}
                    className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-pink-500 focus:outline-none text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-extrabold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-pink-600/30 transition-all active:scale-98"
                >
                  <Cake className="w-4 h-4" />
                  <span>Transmit Shoutout to DJ Console</span>
                </button>
              </form>
            </div>

            {/* Tonight's Celebration Roster */}
            {shoutouts.length > 0 && (
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tonight's Birthday Honor Roll</span>
                </h4>
                <div className="space-y-2">
                  {shoutouts.slice(0, 3).map(sh => (
                    <div key={sh.id} className="p-3 bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{sh.celebrant_name} ({sh.booth_number})</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-xs">{sh.customized_text}</p>
                      </div>
                      <span className="text-[10px] bg-pink-950 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded font-mono font-bold">
                        {sh.is_announced ? 'Announced' : 'Queued'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* =======================================================================
            TAB 3: WORKING DJ SONG REQUEST BAR
           ======================================================================= */}
        {activeTab === 'dj_request' && (
          <div id="dj-requests-section" className="max-w-2xl mx-auto space-y-6">
            
            <div className="bg-gradient-to-b from-[#12081d] via-gray-950 to-black border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
              
              {/* Confidentiality layout banner */}
              <div className="mb-6 p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-start space-x-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white uppercase tracking-wider text-xs">
                    Private DJ Transmission
                  </p>
                  <p className="text-purple-300/90 text-[11px] mt-0.5">
                    Your request dispatches directly to the resident DJ's headphone console. Track selections remain strictly confidential.
                  </p>
                </div>
              </div>

              {djSentCode && (
                <div className="mb-6 p-4 bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 rounded-2xl text-xs flex items-center justify-between animate-in fade-in">
                  <div>
                    <h4 className="font-bold text-white text-sm">Song Received on Decks!</h4>
                    <p className="mt-0.5 text-emerald-300">
                      Tracking Code: <span className="font-mono text-white font-bold">{djSentCode}</span>. Up next in mix transition.
                    </p>
                  </div>
                  <button
                    onClick={() => setDjSentCode(null)}
                    className="text-xs bg-emerald-800 text-white px-2 py-1 rounded"
                  >
                    Done
                  </button>
                </div>
              )}

              <form onSubmit={handleDJSubmit} className="space-y-4 text-xs">
                
                {/* Genre Selector */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1.5">Music Genre / Style</label>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 custom-scrollbar">
                    {['Amapiano', 'Afrobeats', 'Zed Beats', 'Hip-Hop / Trap', 'Deep House'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setDjGenre(g)}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-bold transition-all ${
                          djGenre === g
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-900 text-gray-400 border border-gray-800'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Natasha"
                      value={djName}
                      onChange={(e) => setDjName(e.target.value)}
                      className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Table or VIP Booth *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VIP V02 / Table 7"
                      value={djBooth}
                      onChange={(e) => setDjBooth(e.target.value)}
                      className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Song Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Water"
                      value={djSong}
                      onChange={(e) => setDjSong(e.target.value)}
                      className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Artist *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tyla"
                      value={djArtist}
                      onChange={(e) => setDjArtist(e.target.value)}
                      className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Special Dedication / Note for DJ</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Dedicating this to Table 5 celebrating our graduation!"
                    value={djNote}
                    onChange={(e) => setDjNote(e.target.value)}
                    className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-extrabold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/30 transition-all active:scale-98"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Direct to Resident DJ</span>
                </button>
              </form>
            </div>

          </div>
        )}

      </div>

      {/* VIP 20-min Reservation Modal */}
      {selectedBooth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#0a0d14] border border-amber-500/40 rounded-3xl p-6 text-white shadow-2xl relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>20-MINUTE HOLD RESERVATION</span>
              </span>
              <button
                onClick={() => setSelectedBooth(null)}
                className="w-7 h-7 rounded-lg bg-gray-900 text-gray-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <h3 className="font-serif-display text-xl font-black text-white">
              {selectedBooth.name} ({selectedBooth.booth_code})
            </h3>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Holds table for 20 minutes from booking. Min spend: <strong className="text-amber-400 font-mono">ZMW {selectedBooth.min_spend.toFixed(2)}</strong>.
            </p>

            <form onSubmit={handleLockSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mwape Chanda"
                  value={vipReserverName}
                  onChange={(e) => setVipReserverName(e.target.value)}
                  className="w-full p-2.5 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0977 123 456"
                    value={vipReserverPhone}
                    onChange={(e) => setVipReserverPhone(e.target.value)}
                    className="w-full p-2.5 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Guest Count</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedBooth.capacity}
                    value={vipGuests}
                    onChange={(e) => setVipGuests(e.target.value)}
                    className="w-full p-2.5 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Minimum Spend Guarantee Method</label>
                <select
                  value={vipPayment}
                  onChange={(e) => setVipPayment(e.target.value as PaymentGateway)}
                  className="w-full p-2.5 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-amber-400"
                >
                  <option value="mtn">MTN MoMo (*115#)</option>
                  <option value="airtel">Airtel Money (*115#)</option>
                  <option value="zamtel">Zamtel Kwacha (*115#)</option>
                  <option value="cash">Settle Cash at VIP Door</option>
                </select>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 leading-snug">
                Your table will be placed in an exclusive 20-minute holding state. If not checked in within 20 minutes, the hold expires automatically.
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs shadow-lg shadow-amber-500/20"
                >
                  Confirm & Lock 20-Min Hold
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBooth(null)}
                  className="px-4 py-3 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
