import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { incrementModalCount, decrementModalCount } from '../utils/modalHelper';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  variant?: 'amber' | 'purple' | 'red';
  hideHeader?: boolean;
  allowBackdropClose?: boolean;
  disableEscClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  variant = 'amber',
  hideHeader = false,
  allowBackdropClose = true,
  disableEscClose = false,
}: ModalProps) {
  // Register modal open state globally on document.body using a counter
  useEffect(() => {
    if (isOpen) {
      incrementModalCount();
      return () => {
        decrementModalCount();
      };
    }
  }, [isOpen]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableEscClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, disableEscClose]);

  // Variant classes mapping
  const variantStyles = {
    amber: {
      border: 'border-amber-500/30',
      topBorder: 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600',
      glow: 'bg-gradient-to-b from-amber-500/[0.01]',
      title: 'text-amber-400 drop-shadow-[0_1px_4px_rgba(245,158,11,0.2)]',
      closeHover: 'hover:text-amber-400',
    },
    purple: {
      border: 'border-purple-500/30',
      topBorder: 'bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600',
      glow: 'bg-gradient-to-b from-purple-500/[0.01]',
      title: 'text-purple-400 drop-shadow-[0_1px_4px_rgba(168,85,247,0.2)]',
      closeHover: 'hover:text-purple-400',
    },
    red: {
      border: 'border-red-500/30',
      topBorder: 'bg-gradient-to-r from-red-600 via-red-400 to-red-600',
      glow: 'bg-gradient-to-b from-red-500/[0.01]',
      title: 'text-red-400 drop-shadow-[0_1px_4px_rgba(239,68,68,0.2)]',
      closeHover: 'hover:text-red-400',
    },
  };

  const currentStyles = variantStyles[variant] || variantStyles.amber;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={allowBackdropClose ? onClose : undefined}
            className={`absolute inset-0 bg-stone-950/80 backdrop-blur-[2px] ${allowBackdropClose ? 'cursor-pointer' : ''}`}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.22 }}
            className={`relative w-full max-w-md bg-stone-900 border ${currentStyles.border} rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col font-sans select-none`}
          >
            {/* Ambient themed top border and inner shadow */}
            <div className={`absolute top-0 inset-x-0 h-1 ${currentStyles.topBorder}`} />
            <div className={`absolute inset-0 ${currentStyles.glow} to-transparent pointer-events-none`} />

            {/* Header */}
            {!hideHeader && (
              <div className="flex items-center justify-between border-b border-stone-800 p-4 sm:p-5">
                <h2 className={`text-base sm:text-lg font-serif font-black uppercase tracking-wider ${currentStyles.title}`}>
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className={`p-1 text-stone-400 ${currentStyles.closeHover} hover:bg-stone-800 rounded-lg transition-all cursor-pointer`}
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content Slot */}
            <div className="p-5 sm:p-6 overflow-y-auto max-h-[80vh] text-stone-200">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
