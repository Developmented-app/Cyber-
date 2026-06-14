import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Shield, Terminal, Zap, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
}

interface ChatWidgetProps {
  language: 'en' | 'kh';
  t: (key: string) => string;
}

export default function ChatWidget({ language, t }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: t('chat.welcome'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const presetQuestions = [
    { en: "Report Phishing Threat", kh: "រាយការណ៍អំពីអ៊ីមែលបោកប្រាស់" },
    { en: "Explain ISO 27001 Requirements", kh: "ពន្យល់អំពីតម្រូវការ ISO 27001" },
    { en: "Schedule Security Audit", kh: "កក់ការធ្វើសវនកម្មសន្តិសុខ" }
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error('API server call failed');
      }

      const data = await response.json();
      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: data.reply || "Aegis backup protocol activated. Please reach our direct threat helpline.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI chat error:", err);
      const errMsg: Message = {
        id: Math.random().toString(),
        sender: 'system',
        text: language === 'en' 
          ? "SOC Network Timeout. Please verify your connection or call +855 (0) 23 999 123 directly." 
          : "អសកម្មការតភ្ជាប់បណ្តាញ SOC។ សូមពិនិត្យការតភ្ជាប់ ឬទូរស័ព្ទទៅ +៨៥៥ (០) ២៣ ៩៩៩ ១២៣ ដោយផ្ទាល់។",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="chat-widget-root">
      {/* Floating Trigger Button */}
      <motion.button
        id="chat-toggle-btn"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-2xl transition-colors cursor-pointer border-2 border-emerald-400/30"
      >
        {isOpen ? <X className="w-6 h-6" id="chat-icon-close" /> : <MessageSquare className="w-6 h-6" id="chat-icon-open" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        )}
      </motion.button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chat-window-panel"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-[380px] h-[520px] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
          >
            {/* Header */}
            <div className="p-4 bg-slate-800/90 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 animate-pulse">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold tracking-wide text-slate-200">{t('chat.title')}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">SOC AGENT STABLE</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800"
              style={{ maxHeight: 'calc(100% - 130px)' }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600/95 text-white rounded-br-none'
                        : msg.sender === 'system'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono'
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/40'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="flex items-center gap-1 mb-1 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        <Terminal className="w-3 h-3" /> AEGIS_SOC
                      </div>
                    )}
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span className="block text-[9px] text-slate-400 mt-1 text-right font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-400 rounded-xl rounded-bl-none border border-slate-700/40 px-4 py-3 text-xs flex items-center gap-1.5 font-mono">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-100">●</span>
                    <span className="animate-bounce delay-200">●</span>
                    <span className="text-[10px] text-emerald-400 font-bold ml-1">DECRYPTING RESPONSE...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions presets */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 space-y-1.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                  <HelpCircle className="w-3 h-3 text-emerald-500" /> Suggested Queries:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {presetQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(language === 'en' ? q.en : q.kh)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-2 py-1 rounded-md transition-colors text-left cursor-pointer flex items-center gap-1"
                    >
                      <Zap className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                      {language === 'en' ? q.en : q.kh}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 bg-slate-800/50 border-t border-slate-700/50 flex gap-2 items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chat.placeholder')}
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:bg-slate-700 disabled:text-slate-400 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
