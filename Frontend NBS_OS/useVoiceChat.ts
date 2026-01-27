import { useState, useEffect, useCallback } from 'react';

// Define the global interfaces for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
    SpeechSynthesisUtterance: any;
  }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;

export const useVoiceChat = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const isSupported = !!SpeechRecognition && !!window.speechSynthesis;

  useEffect(() => {
    if (!isSupported) return;

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognitionInstance.onresult = (event: any) => {
      const current = event.results.length - 1;
      const newTranscript = event.results[current][0].transcript;
      setTranscript(newTranscript);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error', event);
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      recognitionInstance.stop();
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      setTranscript('');
      recognition.start();
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis || !SpeechSynthesisUtterance) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Optional: Find a suitable voice (e.g., a female voice)
    const voices = window.speechSynthesis.getVoices();
    const stephVoice = voices.find(v => v.name.includes('Google US English') || v.lang === 'en-US');
    if (stephVoice) {
      utterance.voice = stephVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setTranscript,
  };
};
