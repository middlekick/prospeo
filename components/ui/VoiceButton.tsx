"use client";

import { useState, useEffect, useRef } from "react";

// â”€â”€ Typage minimal de la Web Speech API (non typÃ©e par dÃ©faut) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SpeechRecognitionResult {
  readonly transcript: string;
}
interface SpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: { length: number; [i: number]: { 0: SpeechRecognitionResult; isFinal: boolean } };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

interface Props {
  // AppelÃ© avec le texte final reconnu (Ã  concatÃ©ner cÃ´tÃ© parent)
  onTranscript: (text: string) => void;
  className?: string;
  title?: string;
}

export default function VoiceButton({ onTranscript, className, title }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getRecognition() !== null);
    return () => { recRef.current?.stop(); };
  }, []);

  function toggle() {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = getRecognition();
    if (!rec) return;
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
      }
      if (finalText.trim()) onTranscript(finalText.trim());
    };
    rec.onerror = () => { setListening(false); };
    rec.onend   = () => { setListening(false); };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={title || (listening ? "ArrÃªter la dictÃ©e" : "Dicter une note")}
      className={[
        "shrink-0 flex items-center justify-center transition-all",
        listening
          ? "text-red-400 bg-red-500/15 ring-1 ring-red-500/30 animate-pulse"
          : "text-slate-500 hover:text-brand-400 hover:bg-white/[0.06]",
        className || "h-8 w-8 rounded-md",
      ].join(" ")}
    >
      {listening ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      )}
    </button>
  );
}

