import React, { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2, Bot, User, Sparkles } from "lucide-react";
import { useSelector } from "react-redux";

const STORAGE_KEY = "patient_chat_history_v2";

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="flex items-center gap-2 max-w-[75%]">
        <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center shadow-soft shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="bg-muted/40 backdrop-blur-md border border-border text-foreground self-start rounded-2xl rounded-bl-none px-4 py-3 shadow-soft flex items-center gap-1.5 h-[42px]">
          <span className="w-2 h-2 bg-foreground/40 rounded-full typing-dot"></span>
          <span className="w-2 h-2 bg-foreground/40 rounded-full typing-dot"></span>
          <span className="w-2 h-2 bg-foreground/40 rounded-full typing-dot"></span>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.sender === "user";
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} group animate-slide-up`} style={{ animationDuration: '0.4s' }}>
      <div className={`flex gap-2 max-w-[85%] md:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-soft shrink-0 mt-auto mb-1 ${
          isUser ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-gradient-brand text-white'
        }`}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-2.5 shadow-soft transition-all duration-300 backdrop-blur-md ${
            isUser 
              ? "bg-gradient-primary text-white rounded-2xl rounded-br-none" 
              : "bg-muted/40 border border-border text-foreground rounded-2xl rounded-bl-none hover:bg-muted/60"
          }`}>
            <div className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</div>
          </div>
          <div className={`text-[10px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isUser ? 'mr-1' : 'ml-1'}`}>
            {new Date(msg.createdAt || msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PatientChatbot() {
  const { user } = useSelector((state) => state.auth || {});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get('/api/chatbot/history');
        if (!mounted) return;
        if (res?.data?.success) {
          setMessages(res.data.messages || []);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data.messages || [])); } catch {}
        } else {
          loadLocalFallback();
        }
      } catch (err) {
        loadLocalFallback();
      }
    };

    const loadLocalFallback = () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      setMessages(raw ? JSON.parse(raw) : [{ sender: 'bot', text: "Hello! I am your AI health assistant. How can I help you today?", ts: Date.now() }]);
    };
    
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
    if (containerRef.current) {
        containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const postMessage = async (text) => {
    setLoading(true);
    setMessages((m) => [...m, { sender: 'user', text, ts: Date.now() }]);
    try {
      const res = await api.post('/api/chatbot/message', { message: text });
      if (res?.data?.success) {
        const botMsg = res.data.botMessage ?? { sender: 'bot', text: res.data.reply };
        setMessages((m) => [...m, { sender: 'bot', text: botMsg.text, createdAt: botMsg.createdAt }]);
      } else {
        setMessages((m) => [...m, { sender: 'bot', text: res?.data?.message || 'Server error', ts: Date.now() }]);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      const reason = err.response?.data?.message || err.message || 'Network error';
      setMessages((m) => [...m, { sender: 'bot', text: `⚠️ Error: ${reason}`, ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    postMessage(trimmed);
    setInput('');
  };

  const handleClear = async () => {
    try {
      await api.delete('/api/chatbot/history');
      setMessages([{ sender: 'bot', text: 'Conversation cleared. Hello — ask me anything.', ts: Date.now() }]);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    } catch (err) {
      setMessages([{ sender: 'bot', text: 'Conversation cleared locally (server clear failed).', ts: Date.now() }]);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  };

  return (
    <div className="flex flex-col w-full h-[80vh] min-h-[500px] max-h-[800px] bg-card/60 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-3xl shadow-large overflow-hidden transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-background/90 to-background/50 border-b border-border/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg transform rotate-3">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-primary leading-tight">MediCare AI</h2>
            <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all duration-300" onClick={handleClear} title="Clear conversation">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-gradient-to-b from-transparent to-background/30 scrollbar-thin">
        {messages.map((m, i) => <ChatBubble key={m._id ?? `${i}-${m.createdAt ?? m.ts}`} msg={m} />)}
        {loading && <TypingIndicator />}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background/80 border-t border-border/50 backdrop-blur-md">
        <div className="flex items-center gap-2 p-1.5 bg-muted/30 border border-border/60 rounded-full shadow-inner focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40 transition-all duration-300">
          <Input
            className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-sm md:text-base px-4 h-11"
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            disabled={loading}
          />
          <Button 
            onClick={handleSend} 
            disabled={loading || !input.trim()}
            className="h-11 rounded-full px-5 bg-gradient-primary text-white shadow-glow-primary hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 font-semibold"
          >
            <Send className="w-4 h-4 md:mr-1.5" />
            <span className="hidden md:inline">Send</span>
          </Button>
        </div>
      </div>
      
    </div>
  );
}
