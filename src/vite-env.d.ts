
/// <reference types="vite/client" />

interface Window {
  webkitSpeechRecognition: any;
}

declare class SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onend: () => void;
  onresult: (event: {
    results: {
      [key: number]: {
        [key: number]: {
          transcript: string;
        };
      };
    };
  }) => void;
  start: () => void;
  stop: () => void;
}

declare class webkitSpeechRecognition extends SpeechRecognition {}

