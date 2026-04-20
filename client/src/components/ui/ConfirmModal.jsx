import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'تأكيد الإجراء',
    message = 'هل أنت متأكد من القيام بهذا الإجراء؟',
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    type = 'danger' // 'danger' or 'info'
}) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[#344F1F]/40 backdrop-blur-md"
                />

                {/* Modal content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-[#F9F5F0] rounded-[2rem] shadow-2xl overflow-hidden border border-white/20"
                >
                    {/* Header decoration */}
                    <div className={`h-2 w-full ${type === 'danger' ? 'bg-red-500' : 'bg-[#F4991A]'}`} />

                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 p-2 rounded-full hover:bg-[#F2EAD3] text-[#344F1F]/40 hover:text-[#344F1F] transition-all"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-8 pb-6">
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-2xl ${type === 'danger' ? 'bg-red-50' : 'bg-[#F9F5F0]'} flex items-center justify-center mb-6 shadow-inner`}>
                                <AlertCircle size={32} className={type === 'danger' ? 'text-red-500' : 'text-[#F4991A]'} />
                            </div>

                            <h3 className="text-xl font-black text-[#344F1F] mb-3 font-display">
                                {title}
                            </h3>

                            <p className="text-[#F4991A] font-bold leading-relaxed px-4">
                                {message}
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-[#F2EAD3]/30 flex flex-col sm:flex-row-reverse gap-3">
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 py-4 px-6 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 ${type === 'danger'
                                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
                                    : 'bg-[#344F1F] text-[#F9F5F0] hover:bg-[#2A3F19] shadow-[#344F1F]/20'
                                }`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 px-6 rounded-2xl font-black text-sm bg-[#F9F5F0] text-[#344F1F] hover:bg-[#F2EAD3] border border-[#F2EAD3] shadow-sm transition-all active:scale-95"
                        >
                            {cancelText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
