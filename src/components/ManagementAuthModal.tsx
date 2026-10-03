import React, { useState, useEffect } from 'react';
import { Lock, Shield, Radio, Key, X, AlertCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { verifyStaffCredential, verifyDJCredential } from '../security';

interface ManagementAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStaffLogin: (password: string) => boolean;
  onDJLogin: (password: string) => boolean;
  initialPortal?: 'staff' | 'dj';
}

export const ManagementAuthModal: React.FC<ManagementAuthModalProps> = ({
  isOpen,
  onClose,
  onStaffLogin,
  onDJLogin,
  initialPortal = 'staff'
}) => {
  const [activePortal, setActivePortal] = useState<'staff' | 'dj'>(initialPortal);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActivePortal(initialPortal);
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen, initialPortal]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your authorized management credential.');
      return;
    }

    setError('');
    setIsVerifying(true);

    try {
      if (activePortal === 'staff') {
        const result = await verifyStaffCredential(password);
        if (result.success) {
          onStaffLogin(password);
          onClose();
          setPassword('');
        } else {
          setError(result.error || 'Access denied: Invalid credentials.');
        }
      } else {
        const result = await verifyDJCredential(password);
        if (result.success) {
          onDJLogin(password);
          onClose();
          setPassword('');
        } else {
          setError(result.error || 'Access denied: Invalid DJ console key.');
        }
      }
    } catch {
      setError('An error occurred during cryptographic verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-[#0a0d14] border border-amber-500/40 rounded-3xl p-6 text-white shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>Encrypted Access Control</span>
            </span>
            <h3 className="font-serif-display text-lg font-black text-white">
              Management Portal
            </h3>
          </div>
        </div>

        {/* Portal Switcher */}
        <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-gray-950 rounded-2xl border border-gray-800">
          <button
            type="button"
            onClick={() => { setActivePortal('staff'); setError(''); setPassword(''); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              activePortal === 'staff'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Staff Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => { setActivePortal('dj'); setError(''); setPassword(''); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              activePortal === 'dj'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>DJ Deck Console</span>
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-semibold mb-1.5">
              {activePortal === 'staff' ? 'Staff Authentication Key' : 'DJ Deck Authorization Hash'}
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-amber-400 focus:outline-none text-xs tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5">
              Protected by rate-limited SHA-256 verification and automatic IP lockout.
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isVerifying ? 'Verifying Challenge...' : 'Authorize Access'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
