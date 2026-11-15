import React, { useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Sparkles,
  ShieldCheck,
  Play,
  Square,
  Phone,
  Calendar,
  Bot,
  Headphones,
  RotateCcw,
} from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicConfig';
import {
  OUT_OF_DOMAIN_DATABASE_MESSAGE,
  VOICE_ASSISTANT_PRESETS,
  buildDeterministicDentalAnswer,
  checkIsDentalOrClinicQuery,
} from '../config/dentalAssistantKnowledge';

interface ChatTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  outOfDomain?: boolean;
}

interface DentalAssistantWidgetProps {
  onBookAppointmentClick?: () => void;
}

const INITIAL_WELCOME_MESSAGE: ChatTurn = {
  id: 'welcome-turn',
  role: 'model',
  text: `Hello! I am the ${CLINIC_CONFIG.shortName} Dental Care Chatbot & Voice Assistant. Ask me anything about dental care, what a dentist does, child & adult treatments, our 4 registered doctors, treatment costs & insurance plans, or this website! (Questions outside dental care or our clinic database are not answered.)`,
  timestamp: 'Just now',
  outOfDomain: false,
};

const QUICK_CHAT_QUESTIONS = [
  'What is done as a dentist?',
  'Tell me all about this website',
  'What are your 7 dental services & fees?',
  'Meet your 4 dentists & qualifications',
  'How do you care for kids & nervous patients?',
  'What should I do for a sudden toothache?',
];

export const DentalAssistantWidget: React.FC<DentalAssistantWidgetProps> = ({
  onBookAppointmentClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat');

  // Chat state
  const [messages, setMessages] = useState<ChatTurn[]>([INITIAL_WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [autoSpeakReplies, setAutoSpeakReplies] = useState(false);

  // Voice & TTS Playback state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [activeVoiceTitle, setActiveVoiceTitle] = useState<string>(
    'Ready to speak about our website, what a dentist does & dental care'
  );
  const [activeVoiceTranscript, setActiveVoiceTranscript] = useState<string>(
    VOICE_ASSISTANT_PRESETS[0].spokenScript
  );

  // Voice Conversation (Live WebSocket + Browser Speech Recognition)
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [voiceStatusNote, setVoiceStatusNote] = useState<string>(
    'Tap "Start Voice Conversation" to speak by microphone, or tap any topic below to hear our Voice Assistant.'
  );
  const [voiceInputPrompt, setVoiceInputPrompt] = useState('');

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const liveWsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const speechRecRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  // Cleanup audio and mic on unmount
  useEffect(() => {
    return () => {
      stopAllAudioAndMic();
    };
  }, []);

  const stopAllAudioAndMic = () => {
    // Stop HTMLAudioElement
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    // Stop Web Speech Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Stop SpeechRecognition
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {
        // Ignore
      }
      speechRecRef.current = null;
    }
    // Stop Live WebSocket & Mic stream
    if (liveWsRef.current) {
      try {
        liveWsRef.current.close();
      } catch {
        // Ignore
      }
      liveWsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (captureCtxRef.current) {
      captureCtxRef.current.close().catch(() => {});
      captureCtxRef.current = null;
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
    setIsListeningMic(false);
  };

  const speakWithBrowserFallback = (text: string, idForState: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.pitch = 1.02;
    utterance.lang = 'en-IN';

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(
        (v) =>
          v.lang.includes('en-IN') ||
          v.lang.includes('en-GB') ||
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('google')
      ) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageId(idForState);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    setIsSpeaking(true);
    setSpeakingMessageId(idForState);
    window.speechSynthesis.speak(utterance);
  };

  const speakTextAloud = async (
    text: string,
    idForState: string,
    titleLabel?: string
  ) => {
    // Toggle off if already speaking this exact item
    if (isSpeaking && speakingMessageId === idForState) {
      stopAllAudioAndMic();
      return;
    }

    stopAllAudioAndMic();
    if (titleLabel) {
      setActiveVoiceTitle(titleLabel);
    }
    setActiveVoiceTranscript(text);
    setIsSpeaking(true);
    setSpeakingMessageId(idForState);

    try {
      const response = await fetch('/api/dental-assistant/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.slice(0, 1450),
          voiceName: 'Kore',
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          audioDataUrl?: string;
          fallbackToBrowserSpeech?: boolean;
        };

        if (data.audioDataUrl && !data.fallbackToBrowserSpeech) {
          const audio = new Audio(data.audioDataUrl);
          currentAudioRef.current = audio;
          audio.onended = () => {
            setIsSpeaking(false);
            setSpeakingMessageId(null);
            currentAudioRef.current = null;
          };
          audio.onerror = () => {
            currentAudioRef.current = null;
            speakWithBrowserFallback(text, idForState);
          };
          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback to browser SpeechSynthesis
    }

    speakWithBrowserFallback(text, idForState);
  };

  const sendDentalQuestion = async (
    questionText: string,
    speakResponse = false
  ) => {
    const trimmed = questionText.trim();
    if (!trimmed || isSending) return;

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const historyForServer = messages
      .filter((m) => m.id !== 'welcome-turn')
      .slice(-12)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    setMessages((prev) => [...prev, userTurn]);
    setInputValue('');
    setIsSending(true);

    let replyText = '';
    let isOutOfDomain = false;

    try {
      const response = await fetch('/api/dental-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForServer,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          reply?: string;
          outOfDomain?: boolean;
        };
        if (data.reply) {
          replyText = data.reply;
          isOutOfDomain = Boolean(data.outOfDomain);
        }
      }
    } catch {
      // Fall back to deterministic verified clinic answer
    }

    if (!replyText) {
      const localResult = buildDeterministicDentalAnswer(trimmed);
      replyText = localResult.reply;
      isOutOfDomain = localResult.outOfDomain;
    }

    const modelTurnId = `model-${Date.now()}`;
    const modelTurn: ChatTurn = {
      id: modelTurnId,
      role: 'model',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      outOfDomain: isOutOfDomain,
    };

    setMessages((prev) => [...prev, modelTurn]);
    setIsSending(false);

    if (speakResponse || autoSpeakReplies) {
      setActiveVoiceTitle(
        isOutOfDomain
          ? 'Outside clinic database domain'
          : `Answer: "${trimmed.slice(0, 42)}${trimmed.length > 42 ? '…' : ''}"`
      );
      setActiveVoiceTranscript(replyText);
      await speakTextAloud(
        replyText,
        modelTurnId,
        isOutOfDomain ? 'Outside clinic database domain' : 'Voice Assistant Response'
      );
    }
  };

  const handleChatFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendDentalQuestion(inputValue, false);
  };

  const handleVoicePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = voiceInputPrompt.trim();
    if (!trimmed) return;
    setVoiceInputPrompt('');
    sendDentalQuestion(trimmed, true);
  };

  // Start or stop two-way voice conversation (Browser SpeechRecognition + Gemini Live / TTS)
  const toggleVoiceConversationMic = async () => {
    if (isListeningMic) {
      stopAllAudioAndMic();
      setVoiceStatusNote('Microphone paused. Tap any topic or start voice conversation again.');
      return;
    }

    stopAllAudioAndMic();

    // First check if browser supports SpeechRecognition for reliable spoken query capture
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown })
        .webkitSpeechRecognition;

    if (SpeechRecognitionCtor) {
      try {
        const recognition = new SpeechRecognitionCtor() as {
          lang: string;
          interimResults: boolean;
          continuous: boolean;
          onstart: () => void;
          onresult: (event: {
            results: { [index: number]: { [index: number]: { transcript: string } } };
          }) => void;
          onerror: () => void;
          onend: () => void;
          start: () => void;
          stop: () => void;
        };

        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => {
          setIsListeningMic(true);
          setVoiceStatusNote(
            'Listening... Ask about our website, what a dentist does, child check-ups, root canals, or costs!'
          );
        };

        recognition.onresult = (event) => {
          const transcript = event.results?.[0]?.[0]?.transcript?.trim();
          setIsListeningMic(false);
          if (transcript) {
            setVoiceStatusNote(`You asked: "${transcript}"`);
            if (!checkIsDentalOrClinicQuery(transcript)) {
              setActiveVoiceTitle('Outside clinic database domain');
              setActiveVoiceTranscript(OUT_OF_DOMAIN_DATABASE_MESSAGE);
              sendDentalQuestion(transcript, true);
            } else {
              sendDentalQuestion(transcript, true);
            }
          }
        };

        recognition.onerror = () => {
          setIsListeningMic(false);
          setVoiceStatusNote(
            'Microphone access was blocked or quiet. Use the voice question box or one-tap audio guides below!'
          );
        };

        recognition.onend = () => {
          setIsListeningMic(false);
        };

        speechRecRef.current = recognition;
        recognition.start();
        return;
      } catch {
        // Fall through to Live WebSocket PCM stream if SpeechRecognition fails to start
      }
    }

    // Fallback: Connect directly to Gemini 3.8 Live WebSocket with 16kHz PCM mic capture
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/dental-live`);
      liveWsRef.current = ws;

      const playbackCtx = new AudioContext({ sampleRate: 24000 });
      playbackCtxRef.current = playbackCtx;
      nextPlayTimeRef.current = 0;

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data) as {
          type?: string;
          message?: string;
          data?: {
            interrupted?: boolean;
            outputTranscription?: { text?: string };
            modelTurn?: {
              parts?: Array<{ inlineData?: { data?: string } }>;
            };
          };
        };

        if (msg.type === 'fallback_mode') {
          setIsListeningMic(false);
          setVoiceStatusNote(
            'Speak or type below, or tap any topic card to hear our Voice Assistant!'
          );
          ws.close();
          return;
        }

        if (msg.type === 'connected') {
          setIsListeningMic(true);
          setVoiceStatusNote(
            'Live Voice Connected! Speak into your microphone about dental care or our clinic.'
          );
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: { sampleRate: 16000, channelCount: 1 },
            });
            mediaStreamRef.current = stream;
            const captureCtx = new AudioContext({ sampleRate: 16000 });
            captureCtxRef.current = captureCtx;
            const source = captureCtx.createMediaStreamSource(stream);
            const processor = captureCtx.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
              if (ws.readyState !== WebSocket.OPEN) return;
              const float32 = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(float32.length);
              for (let i = 0; i < float32.length; i++) {
                int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
              }
              const bytes = new Uint8Array(int16.buffer);
              let binary = '';
              for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              ws.send(JSON.stringify({ type: 'audio', data: btoa(binary) }));
            };

            source.connect(processor);
            processor.connect(captureCtx.destination);
          } catch {
            setIsListeningMic(false);
            setVoiceStatusNote(
              'Microphone permission was not granted. Tap any topic card or ask below to hear our Voice Assistant!'
            );
            ws.close();
          }
        }

        if (msg.type === 'server_content' && msg.data) {
          const sc = msg.data;
          if (sc.outputTranscription?.text) {
            setActiveVoiceTranscript(
              (prev) => `${prev} ${sc.outputTranscription?.text || ''}`.trim()
            );
          }
          if (sc.modelTurn?.parts) {
            for (const part of sc.modelTurn.parts) {
              if (part.inlineData?.data && playbackCtxRef.current) {
                const raw = atob(part.inlineData.data);
                const bytes = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) {
                  bytes[i] = raw.charCodeAt(i);
                }
                const int16 = new Int16Array(bytes.buffer);
                const float32 = new Float32Array(int16.length);
                for (let i = 0; i < int16.length; i++) {
                  float32[i] = int16[i] / 32768;
                }
                const ctx = playbackCtxRef.current;
                const buffer = ctx.createBuffer(1, float32.length, 24000);
                buffer.getChannelData(0).set(float32);
                const audioSource = ctx.createBufferSource();
                audioSource.buffer = buffer;
                audioSource.connect(ctx.destination);
                const startTime = Math.max(
                  ctx.currentTime,
                  nextPlayTimeRef.current
                );
                audioSource.start(startTime);
                nextPlayTimeRef.current = startTime + buffer.duration;
                setIsSpeaking(true);
              }
            }
          }
        }
      };

      ws.onerror = () => {
        setIsListeningMic(false);
        setVoiceStatusNote(
          'Tap any topic card below or type a question to hear our Voice Assistant.'
        );
      };
    } catch {
      setIsListeningMic(false);
      setVoiceStatusNote(
        'Tap any topic card below or type a question to hear our Voice Assistant.'
      );
    }
  };

  return (
    <div
      className="fixed bottom-[72px] md:bottom-6 right-3 sm:right-5 z-50 flex flex-col items-end max-w-[calc(100vw-1.5rem)]"
      aria-label="Dental Care Chatbot and Voice Assistant"
    >
      {/* Expanded Floating Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Sunnybrook Dental Care Chatbot and Voice Assistant"
          className="mb-2.5 w-[calc(100vw-1.5rem)] sm:w-[400px] md:w-[420px] max-h-[calc(100dvh-9rem)] md:max-h-[min(650px,calc(100dvh-6.5rem))] bg-[#FFFFFF] rounded-2xl border-2 border-[#0E7C86] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Top Header */}
          <div className="bg-[#0E7C86] text-[#FFFFFF] px-4 py-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#FFFFFF] text-[#0E7C86] flex items-center justify-center shrink-0 font-extrabold">
                <Bot className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[16px] font-extrabold text-[#FFFFFF] truncate leading-tight">
                  {CLINIC_CONFIG.shortName} Care Assistant
                </h2>
                <p className="text-[12px] text-[#E6F4F1] truncate">
                  Verified Dental Chatbot &amp; Voice Guide
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopAllAudioAndMic}
                  title="Stop speaking"
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#FF7A59] text-[#0B2B3A] text-xs font-extrabold inline-flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>Stop Voice</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  stopAllAudioAndMic();
                  setIsOpen(false);
                }}
                aria-label="Minimize Dental Assistant"
                className="min-w-[34px] min-h-[34px] rounded-lg bg-[#FFFFFF]/15 hover:bg-[#FFFFFF]/25 text-[#FFFFFF] inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs: Chatbot vs Voice Assistant */}
          <div className="grid grid-cols-2 bg-[#E6F4F1] p-1.5 gap-1.5 border-b border-[#0E7C86]/20">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`min-h-[40px] rounded-xl px-3 py-1.5 text-[14px] font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'chat'
                  ? 'bg-[#0E7C86] text-[#FFFFFF] shadow-sm'
                  : 'bg-transparent text-[#0B2B3A] hover:bg-[#FFFFFF]/60'
              }`}
            >
              <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Dental Chatbot</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('voice')}
              className={`min-h-[40px] rounded-xl px-3 py-1.5 text-[14px] font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'voice'
                  ? 'bg-[#FF7A59] text-[#0B2B3A] shadow-sm'
                  : 'bg-transparent text-[#0B2B3A] hover:bg-[#FFFFFF]/60'
              }`}
            >
              <Headphones className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Voice Assistant</span>
            </button>
          </div>

          {/* Domain Guardrail Notice Strip */}
          <div className="bg-[#FFFFFF] px-3.5 py-2 border-b border-[#E6F4F1] flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0E7C86]">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Strictly trained on verified clinic &amp; dental data</span>
            </div>

            {activeTab === 'chat' && (
              <button
                type="button"
                onClick={() => setAutoSpeakReplies((prev) => !prev)}
                aria-pressed={autoSpeakReplies}
                className="text-[12px] font-bold text-[#0B2B3A] hover:text-[#0E7C86] inline-flex items-center gap-1"
              >
                {autoSpeakReplies ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#0E7C86]" />
                    <span>Auto-voice: On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-[#0B2B3A]/70" />
                    <span>Auto-voice: Off</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* TAB 1: DENTAL CARE CHATBOT */}
          {activeTab === 'chat' ? (
            <div className="flex-1 flex flex-col min-h-[370px] max-h-[58vh]">
              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#FFFFFF]">
                {messages.map((turn) => (
                  <div
                    key={turn.id}
                    className={`flex flex-col ${
                      turn.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                        turn.role === 'user'
                          ? 'bg-[#0E7C86] text-[#FFFFFF] rounded-br-sm'
                          : turn.outOfDomain
                          ? 'bg-[#FF7A59]/20 text-[#0B2B3A] border border-[#FF7A59] rounded-bl-sm font-semibold'
                          : 'bg-[#E6F4F1] text-[#0B2B3A] border border-[#0E7C86]/20 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line">{turn.text}</p>

                      {turn.role === 'model' && (
                        <div className="mt-2 pt-1.5 border-t border-[#0B2B3A]/10 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-[#0B2B3A]/70">
                            {turn.outOfDomain
                              ? 'Out-of-domain guard'
                              : 'Verified clinic database'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              speakTextAloud(
                                turn.text,
                                turn.id,
                                'Spoken Chatbot Reply'
                              )
                            }
                            className="inline-flex items-center gap-1 text-[12px] font-extrabold text-[#0E7C86] hover:text-[#0B2B3A]"
                          >
                            {isSpeaking && speakingMessageId === turn.id ? (
                              <>
                                <Square className="w-3 h-3 fill-current" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Listen</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isSending && (
                  <div className="flex items-start">
                    <div className="bg-[#E6F4F1] text-[#0B2B3A] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] font-bold inline-flex items-center gap-2 border border-[#0E7C86]/20">
                      <Sparkles className="w-4 h-4 text-[#0E7C86] animate-spin" />
                      <span>Checking clinic dental database…</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Quick Dental Questions Strip */}
              <div className="px-3 py-2 bg-[#E6F4F1]/60 border-t border-[#0E7C86]/15">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-extrabold text-[#0B2B3A]">
                    Quick dental &amp; clinic questions:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      stopAllAudioAndMic();
                      setMessages([INITIAL_WELCOME_MESSAGE]);
                    }}
                    className="text-[11px] font-bold text-[#0E7C86] hover:underline inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset chat</span>
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {QUICK_CHAT_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendDentalQuestion(q, false)}
                      className="shrink-0 text-[12px] font-bold bg-[#FFFFFF] hover:bg-[#0E7C86] hover:text-[#FFFFFF] text-[#0B2B3A] border border-[#0E7C86]/30 rounded-lg px-2.5 py-1 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Form */}
              <form
                onSubmit={handleChatFormSubmit}
                className="p-3 bg-[#FFFFFF] border-t border-[#0E7C86]/20 flex items-center gap-2"
              >
                <label htmlFor="dental-chat-input" className="sr-only">
                  Ask a dental care or clinic question
                </label>
                <input
                  id="dental-chat-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about teeth, dentists, kids care, fees…"
                  maxLength={500}
                  className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[14px] text-[#0B2B3A] focus:outline-none focus:border-[#0E7C86]"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputValue.trim()}
                  aria-label="Send dental question"
                  className="min-w-[42px] min-h-[42px] rounded-xl bg-[#FF7A59] hover:bg-[#ff6640] disabled:opacity-50 text-[#0B2B3A] font-extrabold inline-flex items-center justify-center px-3"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          ) : (
            /* TAB 2: VOICE ASSISTANT (CONVERSE & LISTEN ABOUT WEBSITE & DENTISTRY) */
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FFFFFF] max-h-[60vh]">
              {/* Voice Assistant Hero Speaker Box */}
              <div className="bg-[#E6F4F1] rounded-2xl p-4 border border-[#0E7C86]/30 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0E7C86]">
                      Interactive Dental Voice Assistant
                    </span>
                    <h3 className="text-[16px] font-extrabold text-[#0B2B3A]">
                      {activeVoiceTitle}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      speakTextAloud(
                        activeVoiceTranscript,
                        'active-transcript-replay',
                        activeVoiceTitle
                      )
                    }
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-[13px] font-extrabold inline-flex items-center gap-1.5 shrink-0 ${
                      isSpeaking
                        ? 'bg-[#FF7A59] text-[#0B2B3A]'
                        : 'bg-[#0E7C86] text-[#FFFFFF]'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Speak Aloud</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live Transcript Box */}
                <div className="bg-[#FFFFFF] rounded-xl p-3 border border-[#0E7C86]/20 text-[13px] text-[#0B2B3A] leading-relaxed max-h-32 overflow-y-auto">
                  {activeVoiceTranscript}
                </div>

                {/* Two-Way Mic Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={toggleVoiceConversationMic}
                    className={`min-h-[42px] px-4 py-2 rounded-xl text-[13px] font-extrabold inline-flex items-center justify-center gap-2 ${
                      isListeningMic
                        ? 'bg-[#FF7A59] text-[#0B2B3A] border-2 border-[#0B2B3A]'
                        : 'bg-[#FFFFFF] text-[#0B2B3A] border border-[#0E7C86] hover:bg-[#0E7C86] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {isListeningMic ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>Stop Microphone</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-[#0E7C86]" />
                        <span>Start Voice Conversation (Mic)</span>
                      </>
                    )}
                  </button>

                  <span className="text-[11px] font-semibold text-[#0B2B3A]/80">
                    {voiceStatusNote}
                  </span>
                </div>
              </div>

              {/* One-Tap Spoken Guides: Website Overview, What a Dentist Does, Services, Kids, Doctors */}
              <div className="space-y-2">
                <h4 className="text-[13px] font-extrabold text-[#0B2B3A]">
                  Tap any topic for a spoken voice guide:
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {VOICE_ASSISTANT_PRESETS.map((preset) => {
                    const isPlayingThis =
                      isSpeaking && speakingMessageId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          speakTextAloud(
                            preset.spokenScript,
                            preset.id,
                            preset.shortTitle
                          )
                        }
                        className={`w-full text-left rounded-xl p-3 border transition-colors flex items-center justify-between gap-3 ${
                          isPlayingThis
                            ? 'bg-[#0E7C86] text-[#FFFFFF] border-[#0E7C86]'
                            : 'bg-[#E6F4F1]/60 hover:bg-[#E6F4F1] text-[#0B2B3A] border-[#0E7C86]/25'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[14px] font-extrabold truncate">
                            {preset.label}
                          </div>
                          <div
                            className={`text-[12px] truncate ${
                              isPlayingThis
                                ? 'text-[#E6F4F1]'
                                : 'text-[#0B2B3A]/75'
                            }`}
                          >
                            {preset.spokenScript}
                          </div>
                        </div>

                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isPlayingThis
                              ? 'bg-[#FF7A59] text-[#0B2B3A]'
                              : 'bg-[#FFFFFF] text-[#0E7C86]'
                          }`}
                        >
                          {isPlayingThis ? (
                            <Square className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ask the Voice Assistant Anything & Hear It Spoken */}
              <form
                onSubmit={handleVoicePromptSubmit}
                className="bg-[#E6F4F1]/60 rounded-xl p-3 border border-[#0E7C86]/20 space-y-2"
              >
                <label
                  htmlFor="voice-prompt-input"
                  className="block text-[12px] font-extrabold text-[#0B2B3A]"
                >
                  Or type a question for the Voice Assistant to speak aloud:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="voice-prompt-input"
                    type="text"
                    value={voiceInputPrompt}
                    onChange={(e) => setVoiceInputPrompt(e.target.value)}
                    placeholder="e.g., What does a dentist do during a root canal?"
                    maxLength={500}
                    className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl border border-[#0B2B3A]/20 bg-[#FFFFFF] text-[13px] text-[#0B2B3A]"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !voiceInputPrompt.trim()}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#FF7A59] text-[#0B2B3A] text-[13px] font-extrabold inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Speak Answer</span>
                  </button>
                </div>
              </form>

              {/* Quick Clinic Action Footer */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E6F4F1]">
                <a
                  href={`tel:${CLINIC_CONFIG.phoneTel}`}
                  className="text-[12px] font-extrabold text-[#0E7C86] hover:underline inline-flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {CLINIC_CONFIG.phoneDisplay}</span>
                </a>
                {onBookAppointmentClick && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onBookAppointmentClick();
                    }}
                    className="text-[12px] font-extrabold text-[#0B2B3A] bg-[#FF7A59] px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book a Visit</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Static Bottom-Right Floating Launcher Buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5 max-w-full">
        {/* Voice Assistant Quick Launch Button */}
        <button
          type="button"
          onClick={() => {
            if (isOpen && activeTab === 'voice') {
              stopAllAudioAndMic();
              setIsOpen(false);
            } else {
              setActiveTab('voice');
              setIsOpen(true);
            }
          }}
          aria-label="Open Dental Voice Assistant"
          className="min-h-[46px] sm:min-h-[50px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-[#FF7A59] hover:bg-[#ff6842] text-[#0B2B3A] font-extrabold shadow-xl border-2 border-[#0B2B3A]/15 inline-flex items-center gap-1.5 sm:gap-2 transition-transform hover:-translate-y-0.5 whitespace-nowrap"
        >
          <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B2B3A] shrink-0" aria-hidden="true" />
          <span className="text-[13px] sm:text-[14px] leading-none">
            {isSpeaking ? 'Voice Speaking…' : 'Voice Assistant'}
          </span>
        </button>

        {/* Dental Chatbot Floating Button */}
        <button
          type="button"
          onClick={() => {
            if (isOpen && activeTab === 'chat') {
              stopAllAudioAndMic();
              setIsOpen(false);
            } else {
              setActiveTab('chat');
              setIsOpen(true);
            }
          }}
          aria-label="Open Dental Care Chatbot"
          className="min-h-[46px] sm:min-h-[50px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-[#0E7C86] hover:bg-[#0b636b] text-[#FFFFFF] font-extrabold shadow-xl border-2 border-[#FFFFFF] inline-flex items-center gap-1.5 sm:gap-2 transition-transform hover:-translate-y-0.5 whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFFFFF] shrink-0" aria-hidden="true" />
          <span className="text-[13px] sm:text-[14px] leading-none">Dental Chatbot</span>
        </button>
      </div>
    </div>
  );
};
