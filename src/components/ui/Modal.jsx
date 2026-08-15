import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    tone = 'danger',
    loading = false
}) => {
    if (!isOpen) return null;

    const toneStyles = {
        danger: {
            iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
            btnConfirm: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200',
            icon: <AlertTriangle className="w-6 h-6" />
        },
        warning: {
            iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
            btnConfirm: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200',
            icon: <AlertTriangle className="w-6 h-6" />
        },
        primary: {
            iconBg: 'bg-blue-50 text-primary border-blue-100',
            btnConfirm: 'btn-primary',
            icon: <Info className="w-6 h-6" />
        }
    };

    const currentTone = toneStyles[tone] || toneStyles.danger;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-md bg-white rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative"
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${currentTone.iconBg}`}>
                            {currentTone.icon}
                        </div>
                        <div className="space-y-1.5 pr-6">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">{message}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${currentTone.btnConfirm}`}
                        >
                            {loading ? 'Processing...' : confirmText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export const AlertModal = ({
    isOpen,
    onClose,
    title = 'Notice',
    message,
    buttonText = 'Got it',
    tone = 'info'
}) => {
    if (!isOpen) return null;

    const toneStyles = {
        info: {
            iconBg: 'bg-blue-50 text-primary border-blue-100',
            icon: <Info className="w-6 h-6" />
        },
        success: {
            iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            icon: <CheckCircle2 className="w-6 h-6" />
        },
        warning: {
            iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
            icon: <AlertTriangle className="w-6 h-6" />
        }
    };

    const currentTone = toneStyles[tone] || toneStyles.info;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-md bg-white rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative"
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${currentTone.iconBg}`}>
                            {currentTone.icon}
                        </div>
                        <div className="space-y-1.5 pr-6">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">{message}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-sm transition-all shadow-md shadow-slate-200"
                        >
                            {buttonText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
