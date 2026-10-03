import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  UploadCloud, 
  Clock, 
  Flame, 
  Sparkles, 
  Check, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { MediaPost } from '../types';

interface TableOfTheNightProps {
  posts: MediaPost[];
  onUploadPhoto: (data: {
    uploader_name: string;
    table_booth: string;
    caption: string;
    image_url: string;
  }) => void;
  onReact: (postId: string, reactionType: keyof MediaPost['reactions']) => void;
}

export const TableOfTheNight: React.FC<TableOfTheNightProps> = ({
  posts,
  onUploadPhoto,
  onReact
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploaderName, setUploaderName] = useState('');
  const [tableBooth, setTableBooth] = useState('');
  const [caption, setCaption] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Time remaining calculator for 10-hour TTL
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTTL = (expiresAt: string) => {
    const exp = new Date(expiresAt).getTime();
    const diffMs = exp - now;
    if (diffMs <= 0) return 'Archiving now';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m TTL`;
  };

  // Binary file picker reader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Image size exceeds 8MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    if (!previewImage) {
      setUploadError('Please capture or select a photo.');
      return;
    }
    if (!uploaderName.trim() || !tableBooth.trim()) {
      setUploadError('Please enter your name and table/booth.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      onUploadPhoto({
        uploader_name: uploaderName.trim(),
        table_booth: tableBooth.trim(),
        caption: caption.trim(),
        image_url: previewImage
      });
      setIsProcessing(false);
      setShowUploadModal(false);
      setPreviewImage(null);
      setUploaderName('');
      setTableBooth('');
      setCaption('');
    }, 500);
  };

  return (
    <section id="table-night-section" className="py-10 bg-gray-950 text-white border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                Table of the Night
              </span>
              <span className="text-[10px] bg-red-950/80 border border-red-500/40 text-red-400 px-2 py-0.5 rounded font-mono font-bold">
                10-HR TTL FEED
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1">
              Live Lounge Moments Stream
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Upload your table photo. Snaps expire and auto-archive into cold storage after 10 hours.
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="self-start sm:self-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs sm:text-sm rounded-xl flex items-center space-x-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Post Table Photo</span>
          </button>
        </div>

        {/* Gallery Grid */}
        {posts.length === 0 ? (
          <div className="p-10 bg-gray-900/60 border border-gray-800 rounded-2xl text-center text-gray-400 text-sm">
            <Camera className="w-8 h-8 mx-auto text-gray-600 mb-2" />
            <p>No table photos posted in the last 10 hours.</p>
            <p className="text-xs text-gray-500 mt-1">Be the first to claim Table of the Night!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map(post => {
              const ttlLabel = formatTTL(post.expires_at);
              return (
                <div
                  key={post.id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-amber-500/40 transition-colors"
                >
                  {/* Image Frame with TTL Badge */}
                  <div className="relative aspect-4/3 bg-black overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.caption || 'Table of the Night'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    
                    {/* Real-Time Countdown TTL Tag */}
                    <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1 shadow-lg">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{ttlLabel}</span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-white border border-gray-800">
                      {post.table_booth}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span className="font-semibold text-gray-300">{post.uploader_name}</span>
                        <span className="text-[10px] font-mono">{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {post.caption && (
                        <p className="text-xs text-gray-200 mt-1 line-clamp-2">
                          "{post.caption}"
                        </p>
                      )}
                    </div>

                    {/* Interactive Tap-based Emoji Reactions */}
                    <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between gap-1 text-xs">
                      
                      <button
                        onClick={() => onReact(post.id, 'fire')}
                        className="flex-1 py-1.5 px-2 bg-gray-950 hover:bg-amber-950/40 border border-gray-800 hover:border-amber-500/40 rounded-lg flex items-center justify-center space-x-1 transition-all active:scale-90"
                        title="Fire Reaction"
                      >
                        <span className="text-sm">🔥</span>
                        <span className="font-mono font-bold text-amber-400 text-xs">{post.reactions.fire}</span>
                      </button>

                      <button
                        onClick={() => onReact(post.id, 'champagne')}
                        className="flex-1 py-1.5 px-2 bg-gray-950 hover:bg-amber-950/40 border border-gray-800 hover:border-amber-500/40 rounded-lg flex items-center justify-center space-x-1 transition-all active:scale-90"
                        title="Champagne Reaction"
                      >
                        <span className="text-sm">🍾</span>
                        <span className="font-mono font-bold text-amber-400 text-xs">{post.reactions.champagne}</span>
                      </button>

                      <button
                        onClick={() => onReact(post.id, 'crown')}
                        className="flex-1 py-1.5 px-2 bg-gray-950 hover:bg-amber-950/40 border border-gray-800 hover:border-amber-500/40 rounded-lg flex items-center justify-center space-x-1 transition-all active:scale-90"
                        title="Crown Reaction"
                      >
                        <span className="text-sm">👑</span>
                        <span className="font-mono font-bold text-amber-400 text-xs">{post.reactions.crown}</span>
                      </button>

                      <button
                        onClick={() => onReact(post.id, 'dance')}
                        className="flex-1 py-1.5 px-2 bg-gray-950 hover:bg-amber-950/40 border border-gray-800 hover:border-amber-500/40 rounded-lg flex items-center justify-center space-x-1 transition-all active:scale-90"
                        title="Dance Floor Reaction"
                      >
                        <span className="text-sm">💃</span>
                        <span className="font-mono font-bold text-amber-400 text-xs">{post.reactions.dance}</span>
                      </button>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Binary Picture Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-gray-950 border border-amber-500/40 rounded-2xl p-6 text-white shadow-2xl relative">
            <h3 className="text-lg font-black uppercase mb-1">Upload Table Photo</h3>
            <p className="text-xs text-gray-400 mb-4">
              Photos appear on Table of the Night and auto-archive after exactly 10 hours.
            </p>

            {uploadError && (
              <div className="p-2.5 mb-3 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 text-xs">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              
              {/* Device Binary File Input / Camera Picker */}
              <div className="border-2 border-dashed border-gray-700 hover:border-amber-500/60 rounded-xl p-4 text-center bg-gray-900/60 cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {previewImage ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-700">
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-2 py-0.5 rounded text-amber-400">
                      Tap to replace
                    </span>
                  </div>
                ) : (
                  <div className="py-4 space-y-1">
                    <UploadCloud className="w-8 h-8 mx-auto text-amber-400" />
                    <p className="font-bold text-white">Tap to Capture or Pick Photo</p>
                    <p className="text-[11px] text-gray-400">JPEG, PNG from device camera or gallery</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mwape"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-amber-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Table / Booth *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Booth V01"
                    value={tableBooth}
                    onChange={(e) => setTableBooth(e.target.value)}
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-amber-400 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Caption</label>
                <input
                  type="text"
                  placeholder="e.g. Celebrating big at Phoenix!"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-amber-400 text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isProcessing ? 'Processing Snap...' : 'Publish to Stream (10-hr TTL)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </section>
  );
};
