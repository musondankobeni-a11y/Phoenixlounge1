import React from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';
import { SystemConfig } from '../types';

interface FooterProps {
  config: SystemConfig;
}

export const Footer: React.FC<FooterProps> = ({ config }) => {
  return (
    <footer className="bg-black text-gray-400 border-t border-gray-900 pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-gray-900 text-xs">
          
          <div>
            <span className="font-extrabold text-white text-sm uppercase tracking-wider block mb-2">
              Phoenix Lounge Kabwe
            </span>
            <p className="flex items-center gap-1.5 text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{config.venue_contacts.address}</span>
            </p>
            <p className="mt-1 text-gray-500">
              Central Province premier nightlife, VIP lounge & charcoal braii hub.
            </p>
          </div>

          <div>
            <span className="font-extrabold text-white text-sm uppercase tracking-wider block mb-2">
              Operational Hours
            </span>
            <p className="flex items-center gap-1.5 text-gray-300">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{config.venue_contacts.hours}</span>
            </p>
            <p className="mt-1 text-gray-500">
              Kitchen and bar operate without downtime until closing.
            </p>
          </div>

          <div>
            <span className="font-extrabold text-white text-sm uppercase tracking-wider block mb-2">
              VIP Table & Management Hotlines
            </span>
            <p className="flex items-center gap-1.5 text-amber-300 font-mono">
              <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{config.venue_contacts.hotline}</span>
            </p>
            <p className="flex items-center gap-1.5 text-amber-300 font-mono mt-1">
              <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{config.venue_contacts.alt_phone}</span>
            </p>
          </div>

        </div>

        {/* Mandatory exact copyright line */}
        <div className="pt-6 text-center text-xs text-gray-500 uppercase tracking-wider font-semibold">
          <p>© Phoenix lounge kabwe design by HUMPHREY NKOBENI.</p>
        </div>
      </div>
    </footer>
  );
};
