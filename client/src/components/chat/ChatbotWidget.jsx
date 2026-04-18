import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';
import { chatAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const SUGGESTIONS = [
  'الفعاليات القادمة',
  'كيف أشارك؟',
  'الشارات والنقاط',
  'ساعات التطوع',
];

const WELCOME = {
  id: 0,
  role: 'bot',
  text: 'أهلاً وسهلاً! أنا مساعد Linka الذكي 👋\n\nيمكنني مساعدتك في اكتشاف الفعاليات والإجابة على أسئلتك.',
};

export default function ChatbotWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: msg }]);
    setLoading(true);

    try {
      const res = await chatAPI.send(msg, user?.id);
      const reply = res.data.reply;
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: reply }]);
      if (!open) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: 'عذراً، حدث خطأ. حاول مرة أخرى 🙏',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* ── Chat Window ─────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:left-6 z-[100] sm:w-96 bg-[#F9F5F0] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col sm:max-h-[600px]"
          >
            <div className="bg-[#344F1F] p-4 sm:p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F9F5F0]/20 rounded-2xl flex items-center justify-center">
                <Bot size={22} className="text-[#F9F5F0]" />
              </div>
              <div className="flex-1">
                <p className="text-[#F9F5F0] font-black text-sm sm:text-base">مساعد Linka الذكي</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-[#F4991A] rounded-full animate-pulse" />
                  <span className="text-[#F9F5F0]/70 text-xs font-bold">متاح الآن للإجابة على استفساراتك</span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl text-[#F9F5F0] hover:bg-white/20 transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll bg-[#F9F5F0]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-[#344F1F] flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={13} className="text-[#F9F5F0]" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user'
                    ? 'bg-[#344F1F] text-[#F9F5F0] rounded-tr-sm'
                    : 'bg-[#F9F5F0] text-[#344F1F] shadow-sm rounded-tl-sm border border-[#F2EAD3]'
                    }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 items-center">
                  <div className="w-7 h-7 rounded-full bg-[#344F1F] flex items-center justify-center">
                    <Bot size={13} className="text-[#F9F5F0]" />
                  </div>
                  <div className="bg-[#F9F5F0] px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-[#F9F5F0]">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 bg-[#F4991A] rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t border-[#F9F5F0] bg-[#F9F5F0]">
                <p className="text-xs text-[#F4991A] mb-2 font-medium">اقتراحات سريعة:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className="text-xs bg-[#F9F5F0] text-[#344F1F] hover:bg-[#F9F5F0] border border-[#F2EAD3] px-3 py-1.5 rounded-full font-semibold transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 bg-[#F9F5F0] border-t border-[#F9F5F0]">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="اكتب رسالتك..."
                  rows={1}
                  className="flex-1 resize-none input-field text-sm py-2.5 max-h-24"
                  style={{ direction: 'rtl' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${input.trim() && !loading
                    ? 'bg-[#344F1F] hover:bg-[#F4991A] text-[#F9F5F0] shadow-md hover:-translate-y-0.5'
                    : 'bg-[#F2EAD3] text-[#344F1F]/50 cursor-not-allowed'
                    }`}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Button ──────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 left-4 sm:left-6 z-50 w-14 h-14 bg-[#F4991A] rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all ${open ? 'hidden sm:flex' : 'flex'}`}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={24} className="text-[#F9F5F0]" />
            </motion.div>
          ) : (
            <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={24} className="text-[#F9F5F0]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        {unread > 0 && !open && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-[#F4991A] text-[#F9F5F0] text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unread}
          </motion.span>
        )}
      </motion.button>
    </>
  );
}
