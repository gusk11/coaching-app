"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface Props {
  text: string;
  onClose: () => void;
}

export function CopyContextModal({ text, onClose }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.select();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-[#0f1624] border border-[#1e2d42] flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#f0f4ff]">Kontext manuell kopieren</p>
            <p className="text-xs text-[#5a7090] mt-0.5">
              Automatisches Kopieren fehlgeschlagen. Text unten markieren und Strg+C drücken.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg text-[#5a7090] hover:text-[#f0f4ff] hover:bg-[#1e2d42] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <textarea
          ref={textareaRef}
          readOnly
          value={text}
          rows={16}
          className="w-full rounded-xl bg-[#141d2e] border border-[#1e2d42] text-xs text-[#8fa3c0] font-mono p-3 resize-none focus:outline-none focus:border-[#3b82f6]/50"
        />
      </div>
    </div>
  );
}
