import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Music, 
  Cake, 
  Trash2, 
  Check, 
  LogOut, 
  Save, 
  Volume2, 
  Clock, 
  Sparkles,
  ShieldCheck,
  Disc,
  Play
} from 'lucide-react';
import { DJSongRequest, DJBirthdayShoutout } from '../types';

interface DJDeckViewProps {
  requests: DJSongRequest[];
  shoutouts: DJBirthdayShoutout[];
  currentTicker: string;
  onUpdateTicker: (ticker: string) => void;
  onDismissRequest: (id: string) => void;
  onDismissShoutout: (id: string) => void;
  onLogout: () => void;
}

export const DJDeckView: React.FC<DJDeckViewProps> = ({
  requests,
  shoutouts,
  currentTicker,
  onUpdateTicker,
  onDismissRequest,
  onDismissShoutout,
  onLogout
}) => {
  const [tickerInput, setTickerInput] = useState(currentTicker);
  const [tickerSaved, setTickerSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'shoutouts'>('requests');
  const [incomingDJAlert, setIncomingDJAlert] = useState<{ type: 'request' | 'shoutout'; title: string; subtitle: string } | null>(null);

  const prevRequestsRef = useRef<Set<string>>(new Set(requests.map(r => r.id)));
  const prevShoutoutsRef = useRef<Set<string>>(new Set(shoutouts.map(s => s.id)));

  // Web Audio DJ sound synthesizer for instant deck alerts
  const playDJChime = (type: 'request' | 'shoutout') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'request') {
        // Bass drop + High hit (F3 -> C5 -> G5)
        [174.61, 523.25, 783.99].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = i === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.2, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.45);
        });
      } else {
        // Sparkling birthday fanfare (C5 -> E5 -> G5 -> C6)
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.2, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.5);
        });
      }
    } catch {}
  };

  // Instant notification detection when a customer sends a Song Request
  useEffect(() => {
    const prev = prevRequestsRef.current;
    const newReq = requests.find(r => !prev.has(r.id));
    if (newReq) {
      playDJChime('request');
      setIncomingDJAlert({
        type: 'request',
        title: `🎵 NEW SONG REQUEST: "${newReq.song_title}" by ${newReq.artist}`,
        subtitle: `From ${newReq.customer_name} (${newReq.booth_table})`
      });
    }
    prevRequestsRef.current = new Set(requests.map(r => r.id));
  }, [requests]);

  // Instant notification detection when a customer sends a Birthday Shoutout
  useEffect(() => {
    const prev = prevShoutoutsRef.current;
    const newShout = shoutouts.find(s => !prev.has(s.id));
    if (newShout) {
      playDJChime('shoutout');
      setIncomingDJAlert({
        type: 'shoutout',
        title: `🎂 NEW BIRTHDAY SHOUTOUT: For ${newShout.celebrant_name} at ${newShout.booth_number}`,
        subtitle: `Anthem: ${newShout.song_selection || 'Birthday Toast'} • "${newShout.customized_text}"`
      });
    }
    prevShoutoutsRef.current = new Set(shoutouts.map(s => s.id));
  }, [shoutouts]);

  const handleSaveTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerInput.trim()) return;
    onUpdateTicker(tickerInput.trim());
    setTickerSaved(true);
    setTimeout(() => setTickerSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Incoming DJ Notification Alert Banner */}
        {incomingDJAlert && (
          <div className={`p-4 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in border ${
            incomingDJAlert.type === 'request'
              ? 'bg-gradient-to-r from-purple-950 via-purple-900 to-purple-950 border-purple-500 text-purple-100'
              : 'bg-gradient-to-r from-pink-950 via-pink-900 to-pink-950 border-pink-500 text-pink-100'
          }`}>
            <div className="flex items-center space-x-3">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <div>
                <p className="text-sm font-black tracking-wide text-white">{incomingDJAlert.title}</p>
                <p className="text-xs opacity-90 mt-0.5">{incomingDJAlert.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setActiveTab(incomingDJAlert.type === 'request' ? 'requests' : 'shoutouts');
                  setIncomingDJAlert(null);
                }}
                className="px-3 py-1.5 bg-black/60 hover:bg-black text-white text-xs font-bold rounded-xl border border-white/20"
              >
                View in Queue
              </button>
              <button
                onClick={() => setIncomingDJAlert(null)}
                className="p-1.5 bg-black/30 hover:bg-black/60 text-white rounded-lg text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Top Control Bar */}
        <div className="bg-gray-900 border border-purple-500/40 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-purple-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30">
                  DJ DECK OPERATOR CONSOLE
                </span>
                <span className="text-xs text-gray-400">12 Freedom Way</span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1">Live Room Control</h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-xs text-right hidden sm:block">
              <span className="text-gray-400">Queue Load: </span>
              <strong className="text-purple-400 font-mono">{requests.length} Songs</strong> • <strong className="text-pink-400 font-mono">{shoutouts.length} Shoutouts</strong>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-950/70 hover:bg-red-900 text-red-200 text-xs font-bold rounded-xl flex items-center space-x-2 border border-red-500/40 transition-colors shadow-md"
              title="Log out from DJ Deck session"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Live Room Music Text Ribbon Controller */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Active Room Music Text Ribbon (Broadcast to all screens)</span>
          </div>

          <form onSubmit={handleSaveTicker} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              placeholder="e.g. NOW SPINNING: KABWE AMAPIANO & AFRO-FUSION SPECIAL..."
              className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-700 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white focus:outline-none font-medium"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-1.5 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{tickerSaved ? 'Updated Ribbon!' : 'Update Ribbon'}</span>
            </button>
          </form>
        </div>

        {/* Console Nav Tabs */}
        <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all ${
              activeTab === 'requests'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Private Customer Requests ({requests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('shoutouts')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all ${
              activeTab === 'shoutouts'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <Cake className="w-4 h-4" />
            <span>Birthday Bar Feed ({shoutouts.length})</span>
          </button>
        </div>

        {/* Tab 1: Private Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs text-purple-200 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Strictly Private: Visible only to authenticated DJ credential.</span>
              </span>
              <span className="text-[11px] font-mono text-purple-300">
                Sorted by arrival time
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="p-12 bg-gray-900 border border-gray-800 rounded-2xl text-center text-gray-400 text-sm">
                <Music className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                <p>No pending song requests from the lounge.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {requests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 bg-gray-900 border border-gray-800 hover:border-purple-500/40 rounded-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded font-black font-mono">
                          {req.booth_table}
                        </span>
                        <span className="text-gray-400 text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-white mt-1">
                        {req.song_title}
                      </h3>
                      <p className="text-xs text-purple-300 font-semibold">
                        by {req.artist}
                      </p>

                      <div className="mt-2 text-xs text-gray-300">
                        <span className="text-gray-500">Guest: </span>
                        <strong>{req.customer_name}</strong>
                      </div>

                      {req.personal_note && (
                        <p className="mt-1 text-xs text-gray-400 italic bg-gray-950/70 p-2 rounded border border-gray-800">
                          "{req.personal_note}"
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 font-mono">{req.id}</span>
                      <button
                        onClick={() => onDismissRequest(req.id)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-red-950 hover:text-red-300 text-gray-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Wipe / Played</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Birthday Bar Shoutouts */}
        {activeTab === 'shoutouts' && (
          <div className="space-y-3">
            {shoutouts.length === 0 ? (
              <div className="p-12 bg-gray-900 border border-gray-800 rounded-2xl text-center text-gray-400 text-sm">
                <Cake className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                <p>No active birthday shoutouts queued.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {shoutouts.map(sh => (
                  <div
                    key={sh.id}
                    className="p-4 bg-gray-900 border border-pink-500/30 rounded-xl flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="bg-pink-950 text-pink-300 px-2 py-0.5 rounded font-black font-mono">
                          {sh.booth_number}
                        </span>
                        <span className="text-gray-400 text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sh.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 mt-1">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        <h3 className="text-base font-black text-white">
                          Celebrant: {sh.celebrant_name}
                        </h3>
                      </div>

                      <div className="mt-2 p-3 bg-pink-950/40 border border-pink-500/30 rounded-lg text-xs text-pink-100">
                        "{sh.customized_text}"
                      </div>

                      <p className="mt-2 text-xs text-amber-300 font-semibold">
                        Song Request: {sh.song_selection}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 font-mono">{sh.id}</span>
                      <button
                        onClick={() => onDismissShoutout(sh.id)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-emerald-950 hover:text-emerald-300 text-gray-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Announced & Clear</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
