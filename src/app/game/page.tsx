"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { MapPin, Send, ShieldAlert, Loader2, FolderOpen, RefreshCw, X, Maximize2, Save } from "lucide-react";
import { processGameTurn, saveGame, getCase } from "../actions";
import { useSearchParams, useRouter } from "next/navigation";

interface LogEntry {
  id: string;
  type: "system" | "user";
  text: string;
  timestamp: string;
  isTyping?: boolean;
}

interface Suspect {
  name: string;
  status: string;
  notes: string;
}

function GameContent() {
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Game State
  const [sceneImageUrl, setSceneImageUrl] = useState("https://image.pollinations.ai/prompt/dark%20rainy%20alleyway%20night%20film%20noir%20style%20black%20and%20white%20photography%20high%20contrast%20grainy?width=1024&height=1024&nologo=true&model=flux");
  const [imageLoading, setImageLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("Unknown");
  const [currentTime, setCurrentTime] = useState("00:00");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentObjective, setCurrentObjective] = useState("SOLVE THE MURDER");
  const [caseSummary, setCaseSummary] = useState("Investigation started.");

  const [isTyping, setIsTyping] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showDossier, setShowDossier] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const id = searchParams.get("caseId");
    if (id && !started) {
      loadGame(id);
    }
  }, [searchParams]);

  const loadGame = async (id: string) => {
    try {
      const game = await getCase(id);
      if (game && game.state) {
        const state = game.state as any;
        setCaseId(id);
        setLogs(state.logs || []);
        setEvidence(state.evidence || []);
        setSuspects(state.suspects || []);
        setGallery(state.gallery || []);
        setCurrentLocation(state.currentLocation || "Unknown");
        setCurrentTime(state.currentTime || "00:00");
        setCurrentObjective(state.currentObjective || "SOLVE THE MURDER");
        setCaseSummary(state.caseSummary || "Investigation started.");
        setGameOver(state.gameOver || false);
        setSceneImageUrl(state.sceneImageUrl || "https://image.pollinations.ai/prompt/dark%20rainy%20alleyway%20night%20film%20noir%20style%20black%20and%20white%20photography%20high%20contrast%20grainy?width=1024&height=1024&nologo=true&model=flux");
        setStarted(true);
      }
    } catch (error) {
      console.error("Failed to load case:", error);
    }
  };

  const saveCurrentGame = async (overrideState?: any) => {
    const state = {
      id: caseId,
      logs: overrideState?.logs || logs,
      evidence: overrideState?.evidence || evidence,
      suspects: overrideState?.suspects || suspects,
      gallery: overrideState?.gallery || gallery,
      currentLocation: overrideState?.currentLocation || currentLocation,
      currentTime: overrideState?.currentTime || currentTime,
      currentObjective: overrideState?.currentObjective || currentObjective,
      caseSummary: overrideState?.caseSummary || caseSummary,
      gameOver: overrideState?.gameOver || gameOver,
      sceneImageUrl: overrideState?.sceneImageUrl || sceneImageUrl
    };

    // If we have a caseId, include it in the saved state so the backend knows
    if (caseId) {
      (state as any).id = caseId;
    }

    try {
      const savedId = await saveGame(state);
      if (savedId && !caseId) {
        setCaseId(savedId);
        // Optionally update URL without reload
        window.history.replaceState(null, "", `/?caseId=${savedId}`);
      }
    } catch (error) {
      console.error("Failed to save game:", error);
    }
  };

  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs, isTyping]);

  const startGame = async () => {
    setStarted(true);
    setIsTyping(true);
    setLogs([]);
    setEvidence([]);
    setSuspects([]);
    setGallery([]);
    setGameOver(false);
    setCurrentObjective("SOLVE THE MURDER");
    setCaseSummary("Investigation started.");

    // Initial call to AI to generate the case
    try {
      const response = await processGameTurn([], "START_GAME");

      const responseId = Date.now().toString();
      const responseText = response.narrative;

      if (response.location) setCurrentLocation(response.location);
      if (response.time) setCurrentTime(response.time);
      if (response.evidence) setEvidence(response.evidence);
      if (response.suspects) setSuspects(response.suspects);
      if (response.current_objective) setCurrentObjective(response.current_objective);
      if (response.case_summary) setCaseSummary(response.case_summary);

      if (response.visual_prompt) {
        setImageLoading(true);
        const prompt = encodeURIComponent(`${response.visual_prompt} film noir style, black and white photography, high contrast, grainy`);
        const seed = Math.floor(Math.random() * 1000000);
        const newUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;
        setSceneImageUrl(newUrl);
        setGallery([newUrl]);
      }

      setLogs([{
        id: responseId,
        type: "system",
        text: responseText,
        timestamp: response.time || "00:00",
        isTyping: false,
      }]);

      setIsTyping(false);

    } catch (error) {
      console.error("Error starting game:", error);
      setIsTyping(false);
      setLogs([{
        id: "error",
        type: "system",
        text: "Failed to load case files. The archives are empty.",
        timestamp: "ERROR",
        isTyping: false
      }]);
    }
  };

  const resetGame = () => {
    setStarted(false);
    setLogs([]);
    setEvidence([]);
    setSuspects([]);
    setGallery([]);
    setGameOver(false);
    setShowDossier(false);
    setSelectedImage(null); // Reset selected image
    setExpandedSection(null);
    setCurrentObjective("SOLVE THE MURDER");
    setCaseSummary("Investigation started.");
  };

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

    // Prepare history for the AI
    const history = logs.map(l => `${l.type.toUpperCase()}: ${l.text}`);

    try {
      const response = await processGameTurn(history, userText);

      const responseId = (Date.now() + 1).toString();
      const responseText = response.narrative;

      // Update State
      if (response.location) setCurrentLocation(response.location);
      if (response.time) setCurrentTime(response.time);
      if (response.current_objective) setCurrentObjective(response.current_objective);
      if (response.case_summary) setCaseSummary(response.case_summary);

      // Merge Evidence (prevent duplicates)
      if (response.evidence && response.evidence.length > 0) {
        setEvidence(prev => Array.from(new Set([...prev, ...response.evidence])));
      }

      // Merge Suspects (update existing or add new)
      if (response.suspects && response.suspects.length > 0) {
        setSuspects(prev => {
          const newSuspects = [...prev];
          response.suspects.forEach((s: Suspect) => {
            const index = newSuspects.findIndex(existing => existing.name === s.name);
            if (index !== -1) {
              newSuspects[index] = s;
            } else {
              newSuspects.push(s);
            }
          });
          return newSuspects;
        });
      }

      // Update Scene Image
      const visualPrompt = response.visual_prompt || "dark noir mystery scene shadows rain";
      setImageLoading(true);
      const prompt = encodeURIComponent(`${visualPrompt} film noir style, black and white photography, high contrast, grainy`);
      const seed = Math.floor(Math.random() * 1000000);
      const newUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;
      setSceneImageUrl(newUrl);
      setGallery(prev => [newUrl, ...prev]);

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
      }, 20);

    } catch (error) {
      console.error("Error processing turn:", error);
      setIsTyping(false);
    }
  };

  // Auto-save when key state changes (debounced or after specific events)
  // For simplicity, we'll call saveCurrentGame inside processGameTurn or use an effect
  // But processGameTurn is async and updates state.
  // Let's use an effect that triggers save when logs change (if started and not typing)
  useEffect(() => {
    if (started && !isTyping && logs.length > 0) {
      // Small delay to ensure state is updated
      const timeout = setTimeout(() => {
        saveCurrentGame();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [logs, isTyping, started]);

  const handleSaveAndQuit = async () => {
    await saveCurrentGame();
    router.push("/");
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 cursor-pointer" onClick={startGame}>
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-1000">
          <h1 className="text-6xl md:text-9xl font-black text-zinc-100 tracking-tighter flicker" style={{ fontFamily: 'var(--font-special-elite)' }}>
            NOIR
          </h1>
          <p className="text-zinc-500 tracking-[0.5em] text-sm md:text-xl uppercase animate-pulse">
            Click to Open Case File
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
          <div className="flex items-center gap-4">
            <button onClick={resetGame} className="text-xs text-zinc-500 hover:text-red-500 transition-colors flex items-center gap-1 uppercase tracking-wider font-bold">
              <RefreshCw className="w-3 h-3" /> Reset Case
            </button>
            <button onClick={handleSaveAndQuit} className="text-xs text-zinc-500 hover:text-amber-500 transition-colors flex items-center gap-1 uppercase tracking-wider font-bold ml-4">
              <Save className="w-3 h-3" /> Save & Quit
            </button>
            <div className="text-xs text-zinc-500 font-bold ml-4">V.2.1.0</div>
          </div>
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
                    onError={() => setImageLoading(false)}
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

            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" /> Status
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-950/50 p-3 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 mb-1">CURRENT OBJECTIVE</div>
                  <div className="text-sm text-zinc-300 font-bold">{gameOver ? "REPORT TO PRECINCT" : currentObjective}</div>
                </div>
                <div className="bg-zinc-950/50 p-3 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 mb-1">LOCATION</div>
                  <div className="text-sm text-zinc-300 font-bold">{currentLocation}</div>
                  <div className="text-[10px] text-zinc-500 mt-2 mb-1">TIME</div>
                  <div className="text-sm text-zinc-300 font-bold">{currentTime}</div>
                </div>

                <button
                  onClick={() => setShowDossier(true)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 p-3 flex items-center justify-center gap-2 transition-all group"
                >
                  <FolderOpen className="w-4 h-4 group-hover:text-amber-500 transition-colors" />
                  <span className="text-xs font-bold uppercase tracking-widest">Open Case Dossier</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-zinc-950/80 relative">

            {/* Dossier Modal */}
            {showDossier && (
              <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md p-8 animate-in fade-in zoom-in-95 duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-6 border-b border-zinc-700 pb-4">
                  <h2 className="text-2xl font-black text-amber-600 tracking-tighter flex items-center gap-3" style={{ fontFamily: 'var(--font-special-elite)' }}>
                    <FolderOpen className="w-6 h-6" /> CASE DOSSIER
                  </h2>
                  <button onClick={() => setShowDossier(false)} className="text-zinc-500 hover:text-zinc-200">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                  {/* Case Summary Section */}
                  <div className="bg-zinc-900/50 border border-zinc-800 p-4 relative overflow-hidden md:col-span-2 flex flex-col max-h-64">
                    <div className="absolute top-0 left-0 w-full h-1 bg-zinc-500/50" />
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <h3 className="text-zinc-400 font-bold tracking-widest text-xs uppercase">Investigation Log</h3>
                      <button onClick={() => setExpandedSection('log')} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-2">
                      <p className="text-sm text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                        {caseSummary}
                      </p>
                    </div>
                  </div>

                  {/* Evidence Section */}
                  <div className="bg-zinc-900/50 border border-zinc-800 p-4 relative overflow-hidden flex flex-col max-h-64">
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-900/50" />
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <h3 className="text-zinc-400 font-bold tracking-widest text-xs uppercase">Evidence Collected</h3>
                      <button onClick={() => setExpandedSection('evidence')} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-2">
                      {evidence.length === 0 ? (
                        <p className="text-zinc-600 italic text-sm">No evidence found yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {evidence.map((item, idx) => (
                            <li key={idx} className="bg-black/40 border border-zinc-800 p-2 text-sm text-zinc-300 font-mono flex items-start gap-2">
                              <span className="text-amber-700 mt-0.5">▪</span> {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Suspects Section */}
                  <div className="bg-zinc-900/50 border border-zinc-800 p-4 relative overflow-hidden flex flex-col max-h-64">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-900/50" />
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <h3 className="text-zinc-400 font-bold tracking-widest text-xs uppercase">Suspects</h3>
                      <button onClick={() => setExpandedSection('suspects')} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-2">
                      {suspects.length === 0 ? (
                        <p className="text-zinc-600 italic text-sm">No suspects identified.</p>
                      ) : (
                        <div className="grid gap-4">
                          {suspects.map((suspect, idx) => (
                            <div key={idx} className="bg-black/40 border border-zinc-800 p-3 relative group hover:border-zinc-600 transition-colors">
                              <div className="absolute -top-2 -right-2 w-4 h-4 bg-zinc-800 rounded-full border border-zinc-600" /> {/* Pin */}
                              <div className="font-bold text-zinc-200 mb-1">{suspect.name}</div>
                              <div className="text-[10px] font-bold uppercase tracking-wider mb-2 text-zinc-500">
                                Status: <span className={suspect.status.toLowerCase().includes('dead') ? 'text-red-500' : 'text-green-500'}>{suspect.status}</span>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-800 pt-2 mt-2">
                                {suspect.notes}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Crime Scene Photos Section */}
                  <div className="bg-zinc-900/50 border border-zinc-800 p-4 relative overflow-hidden md:col-span-2 flex flex-col max-h-96">
                    <div className="absolute top-0 left-0 w-full h-1 bg-zinc-700/50" />
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <h3 className="text-zinc-400 font-bold tracking-widest text-xs uppercase">Crime Scene Photos</h3>
                      <button onClick={() => setExpandedSection('photos')} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-2">
                      {gallery.length === 0 ? (
                        <p className="text-zinc-600 italic text-sm">No photos on file.</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {gallery.map((url, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-square border border-zinc-800 bg-black group overflow-hidden cursor-pointer"
                              onClick={() => setSelectedImage(url)}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Evidence #${idx + 1}`}
                                className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-500"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://placehold.co/1024x1024/1a1a1a/333333?text=IMAGE+CORRUPTED";
                                }}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-zinc-400 p-1 text-center font-mono">
                                IMG_00{gallery.length - idx}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center text-zinc-600 text-[10px] uppercase tracking-[0.3em]">
                  Confidential Investigation Material
                </div>
              </div>
            )}

            {/* Expanded Section Modal */}
            {expandedSection && (
              <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md p-8 animate-in fade-in zoom-in-95 duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-6 border-b border-zinc-700 pb-4">
                  <h2 className="text-2xl font-black text-zinc-200 tracking-tighter flex items-center gap-3 uppercase">
                    {expandedSection === 'log' && 'Investigation Log'}
                    {expandedSection === 'evidence' && 'Evidence Collected'}
                    {expandedSection === 'suspects' && 'Suspects'}
                    {expandedSection === 'photos' && 'Crime Scene Photos'}
                  </h2>
                  <button onClick={() => setExpandedSection(null)} className="text-zinc-500 hover:text-zinc-200">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent p-4 bg-zinc-900/30 border border-zinc-800">
                  {expandedSection === 'log' && (
                    <p className="text-base text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap max-w-4xl mx-auto">
                      {caseSummary}
                    </p>
                  )}

                  {expandedSection === 'evidence' && (
                    <ul className="space-y-4 max-w-4xl mx-auto">
                      {evidence.map((item, idx) => (
                        <li key={idx} className="bg-black/40 border border-zinc-800 p-4 text-base text-zinc-300 font-mono flex items-start gap-3">
                          <span className="text-amber-700 mt-1">▪</span> {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {expandedSection === 'suspects' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                      {suspects.map((suspect, idx) => (
                        <div key={idx} className="bg-black/40 border border-zinc-800 p-6 relative group hover:border-zinc-600 transition-colors">
                          <div className="absolute -top-3 -right-3 w-6 h-6 bg-zinc-800 rounded-full border border-zinc-600" />
                          <div className="font-bold text-xl text-zinc-200 mb-2">{suspect.name}</div>
                          <div className="text-xs font-bold uppercase tracking-wider mb-4 text-zinc-500">
                            Status: <span className={suspect.status.toLowerCase().includes('dead') ? 'text-red-500' : 'text-green-500'}>{suspect.status}</span>
                          </div>
                          <p className="text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-4 mt-2">
                            {suspect.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {expandedSection === 'photos' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {gallery.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square border border-zinc-800 bg-black group overflow-hidden cursor-pointer"
                          onClick={() => setSelectedImage(url)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Evidence #${idx + 1}`}
                            className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://placehold.co/1024x1024/1a1a1a/333333?text=IMAGE+CORRUPTED";
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs text-zinc-400 p-2 text-center font-mono">
                            IMG_00{gallery.length - idx}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}>
                <div className="relative max-w-4xl max-h-full p-1 border-2 border-zinc-800 bg-zinc-950 shadow-2xl">
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-10 right-0 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-8 h-8" />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage}
                    alt="Evidence Enlarged"
                    className="max-w-full max-h-[85vh] object-contain grayscale contrast-125"
                  />
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <span className="bg-black/80 text-zinc-300 px-3 py-1 text-xs font-mono border border-zinc-700">EVIDENCE EXHIBIT #{gallery.indexOf(selectedImage) !== -1 ? gallery.length - gallery.indexOf(selectedImage) : 'UNKNOWN'}</span>
                  </div>
                </div>
              </div>
            )}

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

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-zinc-500 animate-spin" /></div>}>
      <GameContent />
    </Suspense>
  );
}
