import React, { useState, useEffect } from 'react';
import { X, Flame, ArrowRight, Sparkles } from 'lucide-react';
import { AdCampaign } from '../types';

interface InterstitialAdProps {
  intervalSeconds: number;
  enabled: boolean;
  ad?: AdCampaign;
  onOrderNow: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const InterstitialAd: React.FC<InterstitialAdProps> = ({
  intervalSeconds,
  enabled,
  ad,
  onOrderNow,
  onNavigateSection
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedCount, setDismissedCount] = useState(0);

  const isAdActive = enabled && (ad ? ad.is_active !== false : true);

  useEffect(() => {
    if (!isAdActive) {
      setIsVisible(false);
      return;
    }

    // Initial trigger for fast appearance on laptop & mobile devices
    const initialDelayMs = Math.min(Math.max(intervalSeconds, 5), 8) * 1000;
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, initialDelayMs);

    // Recurring periodic interval
    const periodicTimer = setInterval(() => {
      setIsVisible(true);
    }, Math.max(intervalSeconds, 8) * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(periodicTimer);
    };
  }, [intervalSeconds, isAdActive, dismissedCount]);

  if (!isAdActive || !isVisible) return null;

  const handleAction = () => {
    setIsVisible(false);
    if (ad?.action_target === 'vip' && onNavigateSection) {
      onNavigateSection('vip-section');
    } else if (ad?.action_target === 'dj' && onNavigateSection) {
      onNavigateSection('interactive-section');
    } else {
      onOrderNow();
    }
  };

  const badgeText = ad?.badge_text || 'Phoenix Special Promotion';
  const title = ad?.title || "Tonight's Signature Braii & Cold Buckets";
  const description = ad?.description || 'Order a Phoenix Platter & 6 Mosi Lagers directly to your table with zero wait time.';
  const priceTag = ad?.price_tag || 'Special ZMW 850';
  const actionText = ad?.action_text || 'Order To Table';

  return (
    <div 
      className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 max-w-sm sm:max-w-md mx-auto sm:mx-0 animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto"
      role="dialog"
      aria-label="Promotional Announcement"
    >
      <div className="bg-[#0a0d14]/98 backdrop-blur-xl border-2 border-amber-500/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(245,158,11,0.35)] text-white relative flex flex-col">
        
        {/* Close button with large touch target on mobile */}
        <button
          onClick={() => {
            setIsVisible(false);
            setDismissedCount(c => c + 1);
          }}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/80 hover:bg-black text-gray-300 hover:text-white flex items-center justify-center text-xs border border-gray-700 shadow-lg active:scale-95 transition-transform"
          aria-label="Close promotion"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ad Poster Image for Laptop & Mobile Screen Sizes */}
        {ad?.image_url && (
          <div className="w-full h-32 sm:h-40 overflow-hidden relative bg-black shrink-0">
            <img 
              src={ad.image_url} 
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Fallback placeholder if custom image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-transparent to-black/40" />
            
            <div className="absolute bottom-2.5 left-3.5 flex items-center space-x-1.5 text-amber-400 text-[10px] sm:text-xs font-black uppercase tracking-wider bg-black/80 backdrop-blur px-2.5 py-1 rounded-lg border border-amber-500/40">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{badgeText}</span>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          
          {!ad?.image_url && (
            <div className="flex items-center space-x-1.5 text-amber-400 text-[11px] font-black uppercase tracking-wider mb-1.5">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{badgeText}</span>
            </div>
          )}

          <div>
            <h4 className="font-serif-display font-black text-sm sm:text-base text-white leading-snug tracking-wide">
              {title}
            </h4>
            <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between gap-3">
            {priceTag ? (
              <span className="text-xs sm:text-sm text-amber-400 font-black font-mono tracking-tight bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                {priceTag}
              </span>
            ) : <div />}

            <button
              onClick={handleAction}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95"
            >
              <span>{actionText}</span>
              <ArrowRight className="w-3.5 h-3.5 text-black" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
