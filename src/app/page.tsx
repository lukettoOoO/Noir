"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Send, ShieldAlert, Loader2 } from "lucide-react";
import { processGameTurn } from "./actions";

interface LogEntry {
  id: string;
  type: "system" | "user";
  text: string;
  timestamp: string;
  isTyping?: boolean;
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "1",
      type: "system",
      text: "CASE FILE #2025-001: THE MIDNIGHT SHADOW\nLocation: 42nd Street Alley\nTime: 23:45\n\nDetective, you've arrived at the scene. The rain is heavy, washing away potential evidence. The body lies near the dumpster.",
      timestamp: "23:45",
      isTyping: false,
    },
  ]);

  // Initial placeholder image
  const [sceneImageUrl, setSceneImageUrl] = useState("https://image.pollinations.ai/prompt/dark%20rainy%20alleyway%20night%20film%20noir%20style%20black%20and%20white%20photography%20high%20contrast%20grainy?width=1024&height=1024&nologo=true&model=flux");
  const [imageLoading, setImageLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState("42nd Street Alley");
  const [currentTime, setCurrentTime] = useState("23:45");

  const [isTyping, setIsTyping] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || gameOver) return;

    const userText = input;
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type: "user",
      text: `> ${userText}`,
      timestamp: currentTime,
      isTyping: false,
    };

    setLogs((prev) => [...prev, newLog]);
    setInput("");
    setIsTyping(true);

    // Prepare history for the AI (simplified)
    const history = logs.map(l => `${l.type.toUpperCase()}: ${l.text}`);

    try {
      const response = await processGameTurn(history, userText);

      const responseId = (Date.now() + 1).toString();
      const responseText = response.narrative;

      // Update State
      if (response.location) setCurrentLocation(response.location);
      if (response.time) setCurrentTime(response.time);

      // Update Scene Image - FORCE generation even if prompt is weak
      const visualPrompt = response.visual_prompt || "dark noir mystery scene shadows rain";
      setImageLoading(true);
      const prompt = encodeURIComponent(`${visualPrompt} film noir style, black and white photography, high contrast, grainy`);
      const seed = Math.floor(Math.random() * 1000000);
      const newUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;
      setSceneImageUrl(newUrl);

      if (response.game_over) {
        setGameOver(true);
      }

      setLogs((prev) => [...prev, {
        id: responseId,
        type: "system",
        text: "",
        timestamp: response.time || currentTime,
        isTyping: true,
      }]);

      // Typewriter effect
      let i = 0;
      const interval = setInterval(() => {
        setLogs((prev) => prev.map(log => {
          if (log.id === responseId) {
            return { ...log, text: responseText.slice(0, i + 1) };
          }
          return log;
        }));
        i++;
        if (i >= responseText.length) {
          clearInterval(interval);
          setIsTyping(false);
          setLogs((prev) => prev.map(log => {
            if (log.id === responseId) {
              return { ...log, isTyping: false };
            }
            return log;
          }));
        }
      }, 20); // Faster typing

    } catch (error) {
      console.error("Error processing turn:", error);
      setIsTyping(false);
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 cursor-pointer" onClick={() => setStarted(true)}>
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-1000">
          <h1 className="text-6xl md:text-9xl font-black text-zinc-100 tracking-tighter flicker" style={{ fontFamily: 'var(--font-special-elite)' }}>
            NOIR
          </h1>
          <p className="text-zinc-500 tracking-[0.5em] text-sm md:text-xl uppercase animate-pulse">
            Click to Initialize Terminal
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-4 md:p-8 font-mono flex items-center justify-center overflow-hidden">
      <div className={`w-full max-w-4xl border border-zinc-700 bg-zinc-900/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col h-[85vh] relative z-10 backdrop-blur-sm transition-all duration-500 ${gameOver ? 'border-green-500 shadow-[0_0_100px_rgba(0,255,0,0.2)]' : ''}`}>

        {/* Top Bar */}
        <div className="border-b border-zinc-700 p-3 bg-zinc-950/90 flex items-center justify-between select-none">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${gameOver ? 'text-green-500' : 'text-red-500'} animate-pulse`}>
              <div className={`w-2 h-2 rounded-full ${gameOver ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs font-bold tracking-[0.2em]">{gameOver ? 'CASE CLOSED' : 'REC'}</span>
            </div>
            <div className="h-4 w-px bg-zinc-700" />
            <span className="text-xs text-zinc-400 tracking-widest">CONFIDENTIAL // EYES ONLY</span>
          </div>
          <div className="text-xs text-zinc-500 font-bold">V.2.0.0</div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-zinc-700 flex flex-col bg-zinc-900/50 hidden md:flex">
            <div className="p-4 border-b border-zinc-700">
              <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Visual Feed
              </div>
              <div className="relative aspect-square w-full bg-zinc-950 border-2 border-zinc-800 p-1 shadow-inner group">
                <div className="relative w-full h-full overflow-hidden grayscale contrast-125 sepia-[.3] transition-all duration-1000 group-hover:sepia-0">
                  {/* Loading Spinner */}
                  {imageLoading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                      <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                    </div>
                  )}

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sceneImageUrl}
                    alt="Crime Scene"
                    className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoading ? 'opacity-50' : 'opacity-90'}`}
                    onLoad={() => setImageLoading(false)}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-50" />
                </div>
                {!gameOver && (
                  <div className="absolute top-2 right-2 bg-red-900/80 text-red-100 text-[10px] px-2 py-0.5 font-bold border border-red-700 transform rotate-3 shadow-lg animate-pulse z-30">
                    LIVE FEED
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 p-4">
              <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" /> Status
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-950/50 p-3 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 mb-1">CURRENT OBJECTIVE</div>
                  <div className="text-sm text-zinc-300 font-bold">{gameOver ? "REPORT TO PRECINCT" : "SOLVE THE MURDER"}</div>
                </div>
                <div className="bg-zinc-950/50 p-3 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 mb-1">LOCATION</div>
                  <div className="text-sm text-zinc-300 font-bold">{currentLocation}</div>
                  <div className="text-[10px] text-zinc-500 mt-2 mb-1">TIME</div>
                  <div className="text-sm text-zinc-300 font-bold">{currentTime}</div>
                </div>
                <div className="bg-zinc-950/50 p-3 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 mb-1">SUSPECTS</div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>- Velma (Lover)</li>
                    <li>- Big Sal (Mob)</li>
                    <li>- Officer O&apos;Malley</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-zinc-950/80 relative">

            {/* Game Over Overlay */}
            {gameOver && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-1000">
                <div className="text-center border-4 border-green-500 p-8 bg-black transform -rotate-2">
                  <h2 className="text-4xl font-black text-green-500 mb-2 tracking-tighter">CASE CLOSED</h2>
                  <p className="text-green-700 font-bold tracking-widest">JUSTICE SERVED</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-2 bg-green-900/20 text-green-500 border border-green-500 hover:bg-green-500 hover:text-black transition-all uppercase text-xs font-bold tracking-widest"
                  >
                    New Case
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent font-mono text-sm md:text-base">
              {logs.map((log) => (
                <div key={log.id} className={`flex flex-col ${log.type === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[95%] ${log.type === 'user' ? 'text-amber-500/90' : 'text-zinc-300'}`}>
                    <span className="text-[10px] text-zinc-600 mb-1 block tracking-widest opacity-50">
                      {log.timestamp} {"//"} {log.type.toUpperCase()}
                    </span>
                    <p className={`whitespace-pre-wrap leading-relaxed ${log.type === 'system' ? 'flicker' : ''}`}>
                      {log.text}
                      {log.isTyping && <span className="cursor-blink">_</span>}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800">
              <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-black/40 border border-zinc-700 p-3 shadow-inner group focus-within:border-zinc-500 transition-colors">
                <span className={`font-bold animate-pulse ${isTyping ? 'text-yellow-500' : 'text-green-500'}`}>{isTyping ? 'BUSY' : '>'}</span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isTyping ? "Decrypting response..." : "Enter command..."}
                  disabled={isTyping || gameOver}
                  className="flex-1 bg-transparent border-none outline-none text-green-500 placeholder-zinc-700 focus:ring-0 font-mono tracking-wider"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isTyping || !input.trim() || gameOver}
                  className="text-zinc-600 hover:text-green-500 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
