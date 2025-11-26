import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';
import { Bot, User, FileAudio, FileText, Globe, MapPin, ExternalLink } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  accentColor: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, accentColor }) => {
  const isUser = message.role === Role.USER;

  // Function to determine color classes based on accent
  const getAccentClasses = () => {
    switch(accentColor) {
      case 'purple': return 'from-purple-500 to-purple-700 bg-purple-600 shadow-purple-500/20';
      case 'emerald': return 'from-emerald-500 to-emerald-700 bg-emerald-600 shadow-emerald-500/20';
      case 'rose': return 'from-rose-500 to-rose-700 bg-rose-600 shadow-rose-500/20';
      default: return 'from-atom-500 to-atom-700 bg-atom-600 shadow-atom-500/20'; // Cyan
    }
  };

  const getBotBgClass = () => {
     switch(accentColor) {
      case 'purple': return 'bg-purple-600';
      case 'emerald': return 'bg-emerald-600';
      case 'rose': return 'bg-rose-600';
      default: return 'bg-atom-600';
    }
  };

  const getTextClass = () => {
    switch(accentColor) {
      case 'purple': return 'text-purple-300';
      case 'emerald': return 'text-emerald-300';
      case 'rose': return 'text-rose-300';
      default: return 'text-atom-300';
    }
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[85%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div 
          className={`
            w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0
            ${isUser ? 'bg-gray-700' : `bg-gradient-to-br shadow-lg ${getAccentClasses()}`}
          `}
        >
          {isUser ? <User className="w-5 h-5 text-gray-300" /> : <Bot className="w-6 h-6 text-white" />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
          <div 
            className={`
              px-5 py-4 rounded-2xl shadow-sm overflow-hidden w-full
              ${isUser 
                ? `${getBotBgClass()} text-white rounded-tr-none` 
                : 'bg-dark-surface border border-dark-border text-gray-200 rounded-tl-none'}
            `}
          >
            {/* Attachments Preview */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {message.attachments.map((att, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-white/10 bg-black/20 p-2">
                    {att.mimeType.startsWith('image/') ? (
                      <img 
                        src={`data:${att.mimeType};base64,${att.data}`} 
                        alt="attachment" 
                        className="h-24 w-auto object-cover rounded"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-gray-300 h-10 px-2">
                        {att.mimeType.includes('audio') ? <FileAudio className="w-4 h-4" /> : <FileText className="w-4 h-4 text-red-400"/>}
                        <span className="truncate max-w-[100px]">{att.name || 'File'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Text Content */}
            <div className={`prose prose-invert max-w-none ${isUser ? 'text-white' : 'text-gray-100'}`}>
              <ReactMarkdown
                components={{
                  // Explicitly style headings to handle "adjust font size according to heading"
                  h1: ({...props}) => <h1 className="text-2xl md:text-3xl font-bold mb-4 mt-2 pb-2 border-b border-white/10" {...props} />,
                  h2: ({...props}) => <h2 className={`text-xl md:text-2xl font-bold mb-3 mt-4 ${isUser ? 'text-white' : getTextClass()}`} {...props} />,
                  h3: ({...props}) => <h3 className="text-lg md:text-xl font-semibold mb-2 mt-3" {...props} />,
                  p: ({...props}) => <p className="mb-3 leading-relaxed text-base" {...props} />,
                  ul: ({...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                  ol: ({...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                  strong: ({...props}) => <strong className={`font-bold ${isUser ? 'text-white' : getTextClass()}`} {...props} />,
                  code: ({className, children, ...props}: any) => {
                     const match = /language-(\w+)/.exec(className || '');
                     const isInline = !match && !String(children).includes('\n');
                     if (isInline) {
                       return <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono text-atom-300" {...props}>{children}</code>;
                     }
                     return (
                       <code className="block bg-black/30 p-3 rounded-lg text-sm font-mono overflow-x-auto my-3 border border-white/10" {...props}>
                         {children}
                       </code>
                     );
                  }
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
            
            {/* Sources / Grounding */}
            {((message.webSources && message.webSources.length > 0) || (message.mapSources && message.mapSources.length > 0)) && (
              <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
                
                {/* Google Search Sources */}
                {message.webSources && message.webSources.length > 0 && (
                  <div className="flex flex-col gap-1">
                     <div className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                       <Globe className="w-3 h-3" /> Sources
                     </div>
                     <div className="flex flex-wrap gap-2">
                       {message.webSources.map((source, idx) => (
                         <a 
                           key={idx} 
                           href={source.uri} 
                           target="_blank" 
                           rel="noreferrer"
                           className="text-xs bg-black/20 hover:bg-black/40 text-blue-300 px-2 py-1 rounded border border-white/5 truncate max-w-[200px] flex items-center gap-1 transition-colors"
                         >
                           {source.title} <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                         </a>
                       ))}
                     </div>
                  </div>
                )}

                {/* Map Locations */}
                {message.mapSources && message.mapSources.length > 0 && (
                   <div className="flex flex-col gap-1">
                     <div className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                       <MapPin className="w-3 h-3" /> Locations
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {message.mapSources.map((map, idx) => (
                         <a 
                           key={idx} 
                           href={map.uri} 
                           target="_blank" 
                           rel="noreferrer"
                           className="text-xs bg-dark-bg hover:bg-black/40 text-gray-300 p-2 rounded border border-white/10 flex items-center justify-between transition-colors group"
                         >
                           <span className="truncate font-medium">{map.title}</span>
                           <MapPin className="w-3 h-3 text-red-400 group-hover:scale-110 transition-transform" />
                         </a>
                       ))}
                     </div>
                  </div>
                )}

              </div>
            )}

            {message.isError && (
               <p className="text-red-300 text-xs mt-2 italic border-l-2 border-red-400 pl-2">Failed to send message.</p>
            )}
          </div>
          
          <span className="text-[10px] text-gray-600 mt-1 px-1 flex items-center gap-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {!isUser && message.mapSources && message.mapSources.length > 0 && (
               <span className="text-xs text-blue-400 font-bold">• Maps</span>
            )}
            {!isUser && message.webSources && message.webSources.length > 0 && (
               <span className="text-xs text-green-400 font-bold">• Search</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;