import React, { useState, useRef } from 'react';
import { Send, Mic, Paperclip, Camera, X, File as FileIcon, Loader2 } from 'lucide-react';
import { Attachment, MediaType } from '../types';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onCameraClick: () => void;
  accentColor: string;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading, onCameraClick, accentColor }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(text, attachments);
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- File Handling ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Extract purely base64 part
          const base64Data = base64String.split(',')[1];
          setAttachments(prev => [...prev, {
            data: base64Data,
            mimeType: file.type || 'application/octet-stream',
            name: file.name
          }]);
        };
        reader.readAsDataURL(file);
      });
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // --- Audio Recording ---
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' }); // Gemini likes standard MIME types
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            setAttachments(prev => [...prev, {
              data: base64Data,
              mimeType: 'audio/wav',
              name: 'Voice Memo'
            }]);
          };
          reader.readAsDataURL(audioBlob);
          // Stop tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Mic access denied", err);
        alert("Microphone access denied.");
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Attachment Preview Bar */}
      {attachments.length > 0 && (
        <div className="flex gap-3 px-4 py-2 overflow-x-auto mb-2">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative flex items-center bg-dark-surface border border-dark-border rounded-lg p-2 pr-8 shrink-0 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center mr-2">
                {att.mimeType.startsWith('image') ? <FileIcon className="w-4 h-4 text-purple-400" /> : <Mic className="w-4 h-4 text-pink-400" />}
              </div>
              <div className="text-xs text-gray-300 max-w-[100px] truncate">{att.name || 'Attachment'}</div>
              <button 
                onClick={() => removeAttachment(idx)}
                className="absolute top-1 right-1 p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-400 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="relative bg-dark-surface/90 backdrop-blur-xl border border-dark-border rounded-2xl shadow-2xl p-2 flex items-end gap-2">
        
        {/* Actions Left */}
        <div className="flex pb-2 gap-1">
           <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-atom-400 hover:bg-white/5 rounded-xl transition-colors"
            title="Attach File"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button 
            onClick={onCameraClick}
            className="p-2.5 text-gray-400 hover:text-atom-400 hover:bg-white/5 rounded-xl transition-colors hidden sm:block"
            title="Open Camera"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept="image/*,application/pdf,audio/*,text/plain"
            onChange={handleFileChange}
          />
        </div>

        {/* Text Area */}
        <div className="flex-1 py-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : "Ask Atom anything..."}
            rows={1}
            className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none max-h-32 py-1 text-sm md:text-base"
            style={{ minHeight: '24px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        </div>

        {/* Actions Right */}
        <div className="flex pb-1 gap-2">
          <button 
            onClick={toggleRecording}
            className={`
              p-3 rounded-xl transition-all duration-300
              ${isRecording 
                ? 'bg-red-500/20 text-red-500 animate-pulse-slow' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'}
            `}
          >
            <Mic className={`w-5 h-5 ${isRecording ? 'fill-current' : ''}`} />
          </button>

          <button 
            onClick={handleSend}
            disabled={isLoading || (!text.trim() && attachments.length === 0)}
            className={`
              p-3 rounded-xl transition-all duration-200
              ${isLoading || (!text.trim() && attachments.length === 0)
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                : 'bg-atom-600 text-white hover:bg-atom-500 shadow-lg shadow-atom-500/25'}
            `}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <div className="text-center text-[10px] text-gray-600 mt-2">
        Atom may display inaccurate info, including about people, so double-check its responses.
      </div>
    </div>
  );
};

export default InputArea;