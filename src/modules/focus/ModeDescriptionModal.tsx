import React from 'react';
import { Modal } from '../../components/Modal';

export interface ModeDescriptionBlock {
  label: string;
  text: React.ReactNode;
  icon?: React.ReactNode;
}

interface ModeDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  variant: 'purple' | 'red';
  blocks: ModeDescriptionBlock[];
}

export function ModeDescriptionModal({
  isOpen,
  onClose,
  title,
  variant,
  blocks,
}: ModeDescriptionModalProps) {
  const accentColor = variant === 'purple' ? 'text-purple-400' : 'text-red-400';
  const borderColor = variant === 'purple' ? 'border-purple-500/20' : 'border-red-500/20';
  const bgColor = variant === 'purple' ? 'bg-purple-950/10' : 'bg-red-950/10';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} variant={variant}>
      <div className="space-y-4">
        {blocks.map((block, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${borderColor} ${bgColor} space-y-1.5`}
          >
            <div className="flex items-center gap-2">
              {block.icon && (
                <span className={`${accentColor} shrink-0`}>
                  {block.icon}
                </span>
              )}
              <h3 className={`text-xs font-serif font-black uppercase tracking-wider ${accentColor}`}>
                {block.label}
              </h3>
            </div>
            <div className="text-xs text-stone-300 leading-relaxed font-sans normal-case">
              {block.text}
            </div>
          </div>
        ))}

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 text-xs font-serif font-black uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
              variant === 'purple'
                ? 'bg-purple-950/40 text-purple-300 border-purple-500/30 hover:bg-purple-900/40 hover:text-purple-200'
                : 'bg-red-950/40 text-red-300 border-red-500/30 hover:bg-red-900/40 hover:text-red-200'
            }`}
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
}
