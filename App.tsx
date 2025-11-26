import React, { useState, useEffect, useRef } from 'react';
import { Menu, AlertTriangle, PanelLeft } from 'lucide-react';

import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import InputArea from './components/InputArea';
import CameraModal from './components/CameraModal';
import InstallGuide from './components/InstallGuide'; // Import the new guide
import { generateResponse, speakText } from './services/geminiService';
import { Message, Role, AppMode, AppSettings, Attachment } from './types';
import { DEFAULT_SYSTEM_INSTRUCTION, MODE_CONFIG } from './constants';

function App() {
  // --- State ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.MODEL,
      text: "Hi! I'm Atom. I'm connected to the web and your location. How can I help you study or explore today?",
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop logic handled in Sidebar? Let's default true but responsive.
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false); // New state for guide
  
  // Location state
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | undefined>(undefined);
  
  // PWA Install Prompt State
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  const [mode, setMode] = useState<AppMode>(AppMode.GENERAL);
  const [settings, setSettings] = useState<AppSettings>({
    useTTS: false,
    themeColor: 'cyan',
    userName: 'Student',
    voice: 'Zephyr'
  });
  
  const [isFileProtocol, setIsFileProtocol] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial responsive check
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    // Check if running on file://
    if (window.location.protocol === 'file:') {
        setIsFileProtocol(true);
        setMessages(prev => [...prev, {
            id: 'file-warning',
            role: Role.MODEL,
            text: "⚠️ **Warning:** You are running this file directly from your computer (`file://`). To use the **Install App** feature, Camera, or Microphone permissions properly, you must host this on a local server (like Vercel, or 'Live Server' extension in VS Code).",
            timestamp: Date.now(),
            isError: true
        }]);
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Get location on mount for "Locator" features
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log("Location access denied or unavailable:", error);
        }
      );
    }
  }, []);

  // Capture the PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
      console.log("Install prompt captured");
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // --- Handlers ---

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text,
      attachments,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 2. Prepare System Prompt based on Mode
      const modePrompt = MODE_CONFIG[mode].prompt;
      const combinedSystemPrompt = `${DEFAULT_SYSTEM_INSTRUCTION}\n\nCURRENT MODE: ${modePrompt}\n\nNote: You have access to Google Search and Google Maps. Use them when the user asks for real-time info or locations.`;

      // 3. Call Service
      const response = await generateResponse(
        text, 
        attachments, 
        combinedSystemPrompt,
        userLocation
      );

      // 4. Add Bot Response
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: response.text,
        webSources: response.webSources,
        mapSources: response.mapSources,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);

      // 5. TTS if enabled
      if (settings.useTTS) {
        speakText(response.text, settings.voice);
      }

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: "I encountered an error connecting to my neural core. Please try again.",
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraCapture = (base64Data: string) => {
    // The "Reading" animation happens in the modal, now we just send the data
    handleSendMessage("Analyze this visual data and explain what you see.", [{
      data: base64Data,
      mimeType: 'image/png',
      name: 'Vision Capture'
    }]);
  };

  // Special handler for "Locator" button in Sidebar
  const handleLocatorClick = () => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);
    if (!userLocation) {
      alert("Location permission needed for Locator.");
      return;
    }
    handleSendMessage("Find interesting places near me right now using Maps.", []);
  };

  // Improved Install Handler
  const handleInstallClick = async () => {
    if (isFileProtocol) {
        alert("Cannot install from a local file. Please deploy to Vercel/GitHub Pages or use a local server.");
        return;
    }

    if (window.innerWidth < 768) setIsSidebarOpen(false);
    
    // Scenario 1: We have the magic prompt (Android/Desktop Chrome)
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      // Scenario 2: iOS or Browser doesn't support auto-prompt -> Show Guide
      setIsInstallGuideOpen(true);
    }
  };

  const getThemeColorClass = () => {
    switch(settings.themeColor) {
      case 'purple': return 'text-purple-500';
      case 'emerald': return 'text-emerald-500';
      case 'rose': return 'text-rose-500';
      default: return 'text-atom-500';
    }
  };

  const getBgThemeClass = () => {
    switch(settings.themeColor) {
      case 'purple': return 'bg-purple-500';
      case 'emerald': return 'bg-emerald-500';
      case 'rose': return 'bg-rose-500';
      default: return 'bg-atom-500';
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg text-white overflow-hidden font-sans">
      
      {/* Sidebar - Always passed the install handler now */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentMode={mode}
        onModeChange={(m) => { setMode(m); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
        settings={settings}
        onSettingsChange={setSettings}
        onClearHistory={() => setMessages([])}
        onLocatorClick={handleLocatorClick}
        onCameraClick={() => { if (window.innerWidth < 768) setIsSidebarOpen(false); setIsCameraOpen(true); }}
        onInstallClick={handleInstallClick} 
      />

      {/* Main Content */}
      {/* Added transition-all and dynamic marginLeft (md:ml-72) to accommodate desktop sidebar push */}
      <main className={`flex-1 flex flex-col h-full relative w-full transition-[margin] duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-72' : ''}`}>
        
        {/* Header */}
        <header className="h-16 border-b border-dark-border flex items-center justify-between px-4 md:px-8 bg-dark-bg/80 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-2 -ml-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 active:scale-95 transition-all"
              title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              {isSidebarOpen ? <Menu className="w-6 h-6" /> : <PanelLeft className="w-6 h-6 text-atom-400" />}
            </button>
            <div className="flex flex-col">
              <span className="font-semibold text-white tracking-wide">{mode}</span>
              <div className="flex items-center gap-1.5">
                 <span className={`w-1.5 h-1.5 rounded-full ${getBgThemeClass()} animate-pulse`}></span>
                 <span className={`text-[10px] uppercase tracking-widest font-bold opacity-80 ${getThemeColorClass()}`}>Atom Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Visual Indicator of Mode */}
             <div className={`w-3 h-3 rounded-full shadow-[0_0_15px_currentColor] ${getThemeColorClass()} ${getBgThemeClass()}`}></div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-32 scroll-smooth">
          <div className="max-w-4xl mx-auto">
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                accentColor={settings.themeColor} 
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500 ml-12 text-sm animate-pulse mb-8">
                <div className={`w-2 h-2 rounded-full animate-bounce ${getBgThemeClass()}`} style={{ animationDelay: '0ms' }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${getBgThemeClass()}`} style={{ animationDelay: '150ms' }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${getBgThemeClass()}`} style={{ animationDelay: '300ms' }} />
                <span className="opacity-70">Processing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-bg via-dark-bg to-transparent">
          <InputArea 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
            onCameraClick={() => setIsCameraOpen(true)}
            accentColor={settings.themeColor}
          />
        </div>
      </main>

      {/* Modals */}
      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        currentVoice={settings.voice}
      />
      
      {/* Install Guide Modal */}
      <InstallGuide 
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
      />
    </div>
  );
}

export default App;