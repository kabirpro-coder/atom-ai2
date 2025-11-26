import React, { useState, useEffect } from 'react';
import { AppMode, AppSettings } from '../types';
import { MODE_CONFIG } from '../constants';
import { Atom, Settings, PanelLeftClose, LogOut, MapPin, Volume2, Palette, Camera } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  settings: AppSettings;
  onSettingsChange: (s: AppSettings) => void;
  onClearHistory: () => void;
  onLocatorClick?: () => void;
  onCameraClick?: () => void;
  onInstallClick?: () => void;
}

const VOICES = ['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'];

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentMode,
  onModeChange,
  settings,
  onSettingsChange,
  onClearHistory,
  onLocatorClick,
  onCameraClick,
  onInstallClick
}) => {
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    // Check if running in an iframe (preview mode)
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true);
    }
  }, []);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={onClose}
        />
      )}

      <aside 
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-72 
          bg-dark-surface border-r border-dark-border
          transition-transform duration-300 ease-in-out shadow-2xl shadow-black/50
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        <div className="p-6 border-b border-dark-border flex items-center justify-between bg-gradient-to-r from-transparent to-white/5">
          <div className="flex items-center gap-2 text-atom-500">
            <Atom className="w-8 h-8 animate-spin-slow" />
            <span className="text-xl font-bold tracking-wider text-white">ATOM AI</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" title="Close Sidebar">
            <PanelLeftClose className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          
          {/* Quick Actions */}
           {(onLocatorClick || onCameraClick) && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Quick Actions
              </h3>
              <div className="space-y-2">
                
                {onCameraClick && (
                  <button
                    onClick={onCameraClick}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 group"
                  >
                    <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Smart Vision</span>
                  </button>
                )}
                
                {onLocatorClick && (
                  <button
                    onClick={onLocatorClick}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 group"
                  >
                    <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Locator (Maps)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Modes Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              Core Modules
            </h3>
            <div className="space-y-1">
              {Object.values(AppMode).map((mode) => {
                const config = MODE_CONFIG[mode];
                const Icon = config.icon;
                const isActive = currentMode === mode;
                
                return (
                  <button
                    key={mode}
                    onClick={() => onModeChange(mode)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-atom-500/10 text-atom-400 border border-atom-500/20' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-atom-400' : ''}`} />
                    <span className="text-sm font-medium">{mode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
              <Settings className="w-3 h-3" /> System Configuration
            </h3>
            
            <div className="space-y-6 px-2 mt-4">
              
              {/* TTS Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Auto-Read (TTS)</span>
                <button
                  onClick={() => onSettingsChange({ ...settings, useTTS: !settings.useTTS })}
                  className={`
                    w-11 h-6 rounded-full transition-colors relative
                    ${settings.useTTS ? 'bg-atom-500' : 'bg-gray-700'}
                  `}
                >
                  <span 
                    className={`
                      absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform
                      ${settings.useTTS ? 'translate-x-5' : 'translate-x-0'}
                    `} 
                  />
                </button>
              </div>

              {/* Voice Selector */}
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Volume2 className="w-4 h-4 text-gray-500" />
                  <span>Voice Model</span>
                </div>
                <select 
                  value={settings.voice}
                  onChange={(e) => onSettingsChange({...settings, voice: e.target.value})}
                  className="w-full bg-black/20 border border-gray-700 text-gray-200 text-sm rounded-lg p-2.5 focus:border-atom-500 focus:outline-none"
                >
                  {VOICES.map(v => (
                    <option key={v} value={v} className="bg-dark-surface">{v}</option>
                  ))}
                </select>
              </div>

              {/* Theme Picker */}
               <div className="space-y-2">
                 <div className="flex items-center gap-2 text-sm text-gray-300">
                   <Palette className="w-4 h-4 text-gray-500" />
                   <span>Interface Accent</span>
                 </div>
                 <div className="flex gap-3">
                   {['cyan', 'purple', 'emerald', 'rose'].map(color => (
                     <button
                       key={color}
                       onClick={() => onSettingsChange({ ...settings, themeColor: color })}
                       className={`
                         w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all
                         ${settings.themeColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}
                       `}
                       style={{ backgroundColor: `var(--color-${color}-500, ${color === 'cyan' ? '#0ea5e9' : color === 'purple' ? '#a855f7' : color === 'emerald' ? '#10b981' : '#f43f5e'})` }}
                       title={color}
                     />
                   ))}
                 </div>
               </div>
            </div>
          </div>

          <div className="pt-6 border-t border-dark-border mt-auto">
             <button 
               onClick={onClearHistory}
               className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-red-400 transition-colors text-sm py-2"
             >
               <LogOut className="w-4 h-4" /> Clear Session
             </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;