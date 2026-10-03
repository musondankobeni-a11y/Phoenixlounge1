import React from 'react';
import { Trophy, Calendar, Sparkles, Tv, Flame, Clock } from 'lucide-react';
import { EventItem } from '../types';

interface PromotionsProps {
  events: EventItem[];
}

export const Promotions: React.FC<PromotionsProps> = ({ events }) => {
  const activeEvents = events.filter(e => e.is_active !== false);

  return (
    <section id="promotions-section" className="py-10 bg-black text-white border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              Promotional Content Streams
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1">
            Upcoming Screenings & Theme Nights
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Confirmed calendar for Phoenix Lounge, 12 Freedom Way, Kabwe.
          </p>
        </div>

        {activeEvents.length === 0 ? (
          <div className="p-8 bg-gray-950 border border-gray-800 rounded-2xl text-center text-gray-400 text-sm">
            No upcoming events scheduled at this moment. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeEvents.map(ev => (
              <div
                key={ev.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-lg group"
              >
                {/* Event Photo Poster if available */}
                {ev.image_url && (
                  <div className="w-full h-40 sm:h-44 overflow-hidden relative bg-black">
                    <img 
                      src={ev.image_url} 
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/30" />
                    <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-black/80 backdrop-blur border border-amber-500/40 text-amber-400">
                      {ev.category}
                    </span>
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {!ev.image_url && (
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${ev.badgeColor || 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                          {ev.category}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {ev.date}
                        </span>
                      </div>
                    )}

                    {ev.image_url && (
                      <div className="flex items-center text-[11px] text-gray-400 font-mono gap-1 mb-2">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{ev.date}</span>
                      </div>
                    )}

                    <h3 className="text-lg font-black text-white mt-1">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-amber-400 font-semibold mb-2">
                      {ev.subtitle}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      {ev.tag || 'Live Event'}
                    </span>
                    <span className="text-[11px] text-amber-400 font-bold uppercase">
                      12 Freedom Way
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
