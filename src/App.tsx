import React, { useRef, useState, useMemo } from "react";
import { Camera, ChevronLeft, Trash2, Home as HomeIcon, PieChart, Loader2, History, Bookmark, PlusCircle, Utensils } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { Button, Badge, Input } from "./components/ui";
import { useFoodLog, usePreBuiltFoods } from "./useFoodLog";
import { FoodItem, PreBuiltFood } from "./types";
import { getNutritionDayKey, formatNutritionDayLabel, getDayOfWeek } from "./utils";

type ViewState = "home" | "history" | "saved" | "camera" | "result" | "edit-log" | "create-saved" | "create-log" | "stats";

export default function App() {
  const { logs, addLog, removeLog, updateLog } = useFoodLog();
  const { foods: preBuilds, addFood: addPreBuilt, removeFood: removePreBuilt } = usePreBuiltFoods();

  const [view, setView] = useState<ViewState>("home");
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayKey = getNutritionDayKey(Date.now());
  const todayLogs = useMemo(() => {
    return logs.filter(
      (log) => getNutritionDayKey(log.timestamp) === todayKey
    );
  }, [logs, todayKey]);

  const totals = todayLogs.reduce(
    (acc, log) => {
      acc.calories += log.calories || 0;
      acc.protein += log.protein || 0;
      return acc;
    },
    { calories: 0, protein: 0 }
  );

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        setView("camera");
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    setIsScanning(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage, prompt }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to scan image");
      }

      setScanResult(data);
      setView("result");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveScanned = () => {
    if (scanResult && capturedImage) {
      addLog({
        foodName: scanResult.foodName,
        calories: scanResult.calories,
        protein: scanResult.protein,
        confidence: scanResult.confidence,
        notes: scanResult.notes || prompt,
        imageUrl: capturedImage,
      });
      resetFlow();
    }
  };

  const resetFlow = () => {
    setCapturedImage(null);
    setPrompt("");
    setScanResult(null);
    setIsScanning(false);
    setErrorMsg("");
    setView("home");
  };

  const openEditLog = (id: string) => {
    setEditingLogId(id);
    setView("edit-log");
  };

  const handleLogPreBuilt = (food: PreBuiltFood) => {
    addLog({
      foodName: food.foodName,
      calories: food.calories,
      protein: food.protein,
      confidence: "High",
      notes: "Added from Saved Foods",
      imageUrl: ""
    });
    setView("home");
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--color-canvas)] text-[var(--color-ink)] flex flex-col font-sans select-none antialiased relative">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        className="hidden"
        onChange={handleCapture}
      />

      {view === "home" && (
        <div className="flex-1 flex flex-col pb-28 overflow-y-auto w-full">
          {/* Header */}
          <div className="bg-[var(--color-brand-navy)] shrink-0 pt-12 pb-6 px-6 sm:px-8 text-[var(--color-on-dark)] rounded-b-[24px] shadow-[0_24px_48px_-8px_rgba(15,15,15,0.2)] z-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            <div className="relative z-10 flex items-center justify-between mb-8">
              <h1 className="text-[28px] font-semibold tracking-tight">Macro Lens</h1>
              <div className="bg-[var(--color-surface)] text-[var(--color-ink-deep)] px-3 py-1 rounded-full text-xs font-semibold">
                {formatNutritionDayLabel(todayKey) === "Today" ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) : formatNutritionDayLabel(todayKey)}
              </div>
            </div>
            
            {/* Summary Card */}
            <div className="bg-[var(--color-on-dark)]/10 backdrop-blur-md rounded-[var(--radius-lg)] p-5 border border-[var(--color-on-dark-muted)] flex items-center justify-between">
              <div>
                <p className="text-[var(--color-on-dark-muted)] text-[13px] mb-1 font-medium tracking-wide">CALORIES</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[36px] font-semibold tracking-tight leading-none">{totals.calories}</span>
                </div>
              </div>
              <div className="w-px h-12 bg-[var(--color-on-dark-muted)]/30 mx-4"></div>
              <div>
                <p className="text-[var(--color-on-dark-muted)] text-[13px] mb-1 font-medium tracking-wide">PROTEIN</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[36px] font-semibold tracking-tight leading-none">{totals.protein}</span>
                  <span className="text-[var(--color-on-dark-muted)] text-[14px] font-medium ml-1">g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Log */}
          <div className="flex-1 px-5 pt-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-[22px] font-semibold tracking-tight">Today's Log</h2>
                <span className="text-sm font-medium text-[var(--color-steel)] px-2">{todayLogs.length} items</span>
              </div>
              <button onClick={() => setView("create-log")} className="text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 p-[6px] -mr-2 rounded-full transition-colors active:scale-95">
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>

            {todayLogs.length === 0 ? (
              <div className="bg-[var(--color-card-tint-gray)] rounded-[12px] p-8 mt-4 text-center">
                <div className="bg-[var(--color-canvas)] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[var(--color-hairline)]">
                  <Camera className="w-5 h-5 text-[var(--color-stone)]" />
                </div>
                <h3 className="text-[16px] font-medium mb-1">No meals tracked</h3>
                <p className="text-[14px] text-[var(--color-steel)] max-w-[250px] mx-auto">Tap the camera to scan food, or use saved items.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayLogs.map((item) => (
                  <LogItemCard key={item.id} item={item} onClick={() => openEditLog(item.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {view === "history" && (
        <HistoryView logs={logs} onEditLog={openEditLog} />
      )}

      {view === "saved" && (
        <SavedView 
          preBuilds={preBuilds} 
          onLog={handleLogPreBuilt} 
          onCreate={() => setView("create-saved")} 
          onDelete={removePreBuilt} 
        />
      )}

      {view === "edit-log" && editingLogId && (
        <EditLogView 
          logId={editingLogId} 
          logs={logs} 
          onUpdate={updateLog} 
          onDelete={removeLog} 
          onBack={() => { setEditingLogId(null); setView("home"); }} 
        />
      )}

      {view === "create-saved" && (
        <CreateSavedView 
          onSave={addPreBuilt} 
          onBack={() => setView("saved")} 
        />
      )}

      {view === "create-log" && (
        <CreateManualLogView 
          onSave={addLog} 
          onBack={() => setView("home")} 
        />
      )}

      {view === "stats" && (
        <StatsView logs={logs} />
      )}

      {/* Camera / Prompt View */}
      {view === "camera" && (
        <div className="flex-1 flex flex-col bg-[var(--color-brand-navy)] h-full absolute inset-0 z-50">
          <div className="px-4 h-[64px] flex items-center text-[var(--color-on-dark)] shrink-0 z-10 relative">
            <button onClick={resetFlow} className="p-2 -ml-2 rounded-full hover:bg-[var(--color-on-dark-muted)]/20 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-[18px] font-medium ml-2">Analyze Food</h2>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 py-6">
             {capturedImage && (
                <div className="w-full max-w-md bg-[var(--color-canvas)] p-2 rounded-[var(--radius-xl)] shadow-[0_24px_48px_-8px_rgba(15,15,15,0.2)] relative z-10">
                   <div className="relative rounded-[var(--radius-lg)] overflow-hidden aspect-[4/5] sm:aspect-square bg-[var(--color-surface)] border border-[var(--color-hairline)]">
                     <img src={capturedImage} alt="Captured preview" className="w-full h-full object-cover" />
                     {isScanning && (
                        <div className="absolute inset-0 bg-[#0F1219]/60 backdrop-blur-sm flex flex-col items-center justify-center text-[var(--color-on-dark)]">
                           <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--color-primary)]" />
                           <p className="font-medium animate-pulse tracking-wide">Estimating macros...</p>
                        </div>
                     )}
                   </div>
                </div>
             )}
          </div>
          
          <div className="bg-[var(--color-canvas)] rounded-t-[24px] p-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] shadow-[0_-16px_48px_-8px_rgba(15,15,15,0.1)] shrink-0 relative z-20">
             <div className="max-w-md mx-auto">
               <label className="block text-[14px] font-medium text-[var(--color-slate)] mb-2">Optional Context (weight, preparation)</label>
               <Input 
                 placeholder="e.g. 2 slices of sourdough toast..." 
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 disabled={isScanning}
                 className="mb-4"
               />
               
               {errorMsg && (
                 <div className="mb-4 p-3 bg-[var(--color-semantic-error)]/10 text-[var(--color-semantic-error)] text-sm rounded-[var(--radius-md)] border border-[var(--color-semantic-error)]/20">
                   {errorMsg}
                 </div>
               )}
               
               <Button 
                  className="w-full py-4 text-[16px] h-auto" 
                  onClick={analyzeImage}
                  loading={isScanning}
               >
                  {isScanning ? "Analyzing Image" : "Reveal Nutrition"}
               </Button>
             </div>
          </div>
        </div>
      )}

      {/* Result View */}
      {view === "result" && scanResult && (
        <div className="flex-1 flex flex-col bg-[var(--color-surface)] h-full absolute inset-0 z-50 overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
          {/* Header */}
          <div className="bg-[var(--color-canvas)] px-4 h-[64px] flex items-center border-b border-[var(--color-hairline)] shrink-0 sticky top-0 z-20">
            <button onClick={() => setView("camera")} className="p-2 -ml-2 rounded-full hover:bg-[var(--color-surface-soft)] transition-colors text-[var(--color-ink)]">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-[16px] font-semibold ml-2">Estimation Results</h2>
          </div>
          
          <div className="flex-1 p-5 max-w-md mx-auto w-full">
            <div className="bg-[var(--color-canvas)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] overflow-hidden shadow-sm mb-6">
              <div className="relative h-48 bg-[var(--color-surface)] border-b border-[var(--color-hairline)]">
                 <img src={capturedImage!} alt="Original captured" className="w-full h-full object-cover" />
                 <div className="absolute top-3 right-3 bg-[var(--color-canvas)]/90 backdrop-blur-sm px-3 py-1 rounded-full text-[12px] tracking-wide font-semibold shadow-sm border border-[var(--color-hairline)] text-[var(--color-ink)]">
                    {scanResult.confidence} Match
                 </div>
              </div>
              <div className="p-6">
                 <h2 className="text-[22px] font-semibold leading-tight tracking-tight mb-6">{scanResult.foodName}</h2>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--color-card-tint-peach)] rounded-[var(--radius-lg)] p-4 flex flex-col justify-between">
                       <p className="text-[var(--color-brand-orange-deep)] text-[12px] font-bold mb-2 uppercase tracking-wider">Calories</p>
                       <div className="flex items-baseline gap-1">
                         <span className="text-[32px] font-semibold text-[var(--color-charcoal)] leading-none tracking-tight">{scanResult.calories}</span>
                         <span className="text-[var(--color-slate)] font-medium text-[13px] ml-1">kcal</span>
                       </div>
                    </div>
                    <div className="bg-[var(--color-card-tint-sky)] rounded-[var(--radius-lg)] p-4 flex flex-col justify-between">
                       <p className="text-[var(--color-link-blue-pressed)] text-[12px] font-bold mb-2 uppercase tracking-wider">Protein</p>
                       <div className="flex items-baseline gap-1">
                         <span className="text-[32px] font-semibold text-[var(--color-charcoal)] leading-none tracking-tight">{scanResult.protein}</span>
                         <span className="text-[var(--color-slate)] font-medium text-[13px] ml-1">g</span>
                       </div>
                    </div>
                 </div>
                 
                 {scanResult.notes && (
                   <div className="mt-6 pt-5 border-t border-[var(--color-hairline)]">
                     <p className="text-[14px] text-[var(--color-slate)] leading-relaxed">{scanResult.notes}</p>
                   </div>
                 )}
              </div>
            </div>

            <div className="space-y-3 pb-8">
              <Button variant="primary" className="w-full py-4 text-[16px] h-auto" onClick={handleSaveScanned}>
                Log to Diary
              </Button>
              <Button variant="secondary" className="w-full py-4 text-[16px] h-auto" onClick={resetFlow}>
                Discard Scan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      {["home", "history", "saved", "stats"].includes(view) && (
        <BottomNav view={view} setView={setView} onScan={() => fileInputRef.current?.click()} />
      )}
    </div>
  );
}

/* =====================================================================
   Sub-Views & Components
   ===================================================================== */

function BottomNav({ view, setView, onScan }: { view: string, setView: (v: any) => void, onScan: () => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[80px] pb-[env(safe-area-inset-bottom,0px)] bg-[var(--color-canvas)] border-t border-[var(--color-hairline)] flex justify-around items-center px-2 sm:px-6 z-40 bg-opacity-95 backdrop-blur-md">
      <button onClick={() => setView('home')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${view === 'home' ? 'text-[var(--color-primary)]' : 'text-[var(--color-stone)] hover:text-[var(--color-slate)]'}`}>
        <HomeIcon className="w-6 h-6" />
        <span className="text-[10px] font-semibold tracking-wide">Home</span>
      </button>
      
      <button onClick={() => setView('history')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${view === 'history' ? 'text-[var(--color-primary)]' : 'text-[var(--color-stone)] hover:text-[var(--color-slate)]'}`}>
        <History className="w-6 h-6" />
        <span className="text-[10px] font-semibold tracking-wide">History</span>
      </button>

      <div className="relative -mt-8 flex justify-center w-[72px] shrink-0">
        <button onClick={onScan} className="bg-[var(--color-primary)] text-[var(--color-on-dark)] h-[60px] w-[60px] rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(159,101,214,0.4)] hover:shadow-[0_12px_28px_rgba(159,101,214,0.5)] active:scale-95 transition-all outline-none">
          <Camera className="w-[28px] h-[28px]" />
        </button>
      </div>

      <button onClick={() => setView('saved')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${view === 'saved' ? 'text-[var(--color-primary)]' : 'text-[var(--color-stone)] hover:text-[var(--color-slate)]'}`}>
        <Bookmark className="w-6 h-6" />
        <span className="text-[10px] font-semibold tracking-wide">Saved</span>
      </button>
      
      <button onClick={() => setView('stats')} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${view === 'stats' ? 'text-[var(--color-primary)]' : 'text-[var(--color-stone)] hover:text-[var(--color-slate)]'}`}>
        <PieChart className="w-6 h-6" />
        <span className="text-[10px] font-semibold tracking-wide">Stats</span>
      </button>
    </nav>
  );
}

function LogItemCard({ item, onClick }: { key?: any, item: FoodItem, onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex gap-4 p-4 rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] hover:border-[var(--color-primary)]/40 cursor-pointer transition-colors active:scale-[0.99] shadow-sm">
      <div className="w-[60px] h-[60px] rounded-[var(--radius-md)] overflow-hidden shrink-0 border border-[var(--color-hairline)] bg-[var(--color-surface)]">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.foodName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-card-tint-peach)]">
            <Utensils className="w-6 h-6 text-[var(--color-brand-orange)] opacity-60" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="font-semibold text-[16px] truncate leading-tight mb-[6px]">{item.foodName}</h4>
        <div className="flex gap-4 text-[14px]">
          <span className="text-[var(--color-slate)] font-medium tracking-tight"><span className="text-[var(--color-ink)]">{item.calories}</span> cal</span>
          <span className="text-[var(--color-slate)] font-medium tracking-tight"><span className="text-[var(--color-ink)]">{item.protein}g</span> pro</span>
        </div>
      </div>
    </div>
  );
}

function HistoryView({ logs, onEditLog }: { logs: FoodItem[], onEditLog: (id: string) => void }) {
  const groupedLogs = useMemo(() => {
    return logs.reduce((acc, log) => {
      const dateStr = getNutritionDayKey(log.timestamp);
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(log);
      return acc;
    }, {} as Record<string, FoodItem[]>);
  }, [logs]);

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="flex-1 flex flex-col pb-28 overflow-y-auto bg-[var(--color-surface)] w-full">
      <div className="bg-[var(--color-canvas)] px-6 py-5 border-b border-[var(--color-hairline)] sticky top-0 z-10 shadow-sm">
        <h2 className="text-[22px] font-semibold tracking-tight">Activity Logs</h2>
      </div>
      <div className="p-5 space-y-8">
        {sortedDates.length === 0 ? (
           <div className="text-center text-[var(--color-steel)] mt-12 flex flex-col items-center">
             <History className="w-10 h-10 mb-3 opacity-30" />
             <p className="text-[15px] font-medium">No history available yet.</p>
           </div>
        ) : (
           sortedDates.map(date => {
             const dayLogs = groupedLogs[date];
             const dayCals = dayLogs.reduce((sum, l) => sum + (l.calories||0), 0);
             const dayPro = dayLogs.reduce((sum, l) => sum + (l.protein||0), 0);
             const label = formatNutritionDayLabel(date);

             return (
               <div key={date}>
                 <div className="flex justify-between items-end mb-4 px-1">
                   <h3 className="font-semibold text-[16px] text-[var(--color-slate)]">{label}</h3>
                   <div className="text-[14px] font-medium text-[var(--color-steel)]">{dayCals} kcal • {dayPro}g pro</div>
                 </div>
                 <div className="space-y-3">
                   {dayLogs.map(log => <LogItemCard key={log.id} item={log} onClick={() => onEditLog(log.id)} />)}
                 </div>
               </div>
             )
           })
        )}
      </div>
    </div>
  )
}

function SavedView({ preBuilds, onLog, onCreate, onDelete }: any) {
  return (
    <div className="flex-1 flex flex-col pb-28 overflow-y-auto bg-[var(--color-surface)] w-full">
      <div className="bg-[var(--color-canvas)] px-6 py-5 border-b border-[var(--color-hairline)] sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <h2 className="text-[22px] font-semibold tracking-tight">Saved Foods</h2>
        <button onClick={onCreate} className="text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 p-[6px] -mr-2 rounded-full transition-colors active:scale-95">
          <PlusCircle className="w-6 h-6" />
        </button>
      </div>
      <div className="p-5 space-y-3">
        {preBuilds.length === 0 ? (
           <div className="text-center text-[var(--color-steel)] mt-12 flex flex-col items-center">
             <Bookmark className="w-10 h-10 mb-3 opacity-30" />
             <p className="text-[15px] font-medium">No saved foods yet.</p>
           </div>
        ) : (
          preBuilds.map((food: PreBuiltFood) => (
            <div key={food.id} className="bg-[var(--color-canvas)] rounded-[var(--radius-lg)] p-[18px] border border-[var(--color-hairline)] flex justify-between items-center shadow-sm">
               <div className="flex-1 mr-4 min-w-0">
                 <h4 className="font-semibold text-[16px] mb-1.5 truncate">{food.foodName}</h4>
                 <p className="text-[14px] text-[var(--color-steel)] font-medium"><span className="text-[var(--color-slate)]">{food.calories}</span> kcal • <span className="text-[var(--color-slate)]">{food.protein}</span>g pro</p>
               </div>
               <div className="flex items-center gap-2 shrink-0">
                 <button onClick={() => onLog(food)} className="bg-[var(--color-card-tint-lavender)] text-[var(--color-primary)] px-[14px] py-[8px] rounded-[var(--radius-sm)] text-[14px] font-semibold hover:bg-[var(--color-primary)] hover:text-white transition-colors active:scale-95">Log</button>
                 <button onClick={() => onDelete(food.id)} className="text-[var(--color-muted)] hover:text-[var(--color-semantic-error)] p-1.5 rounded-full transition-colors active:bg-[var(--color-surface)]">
                    <Trash2 className="w-[18px] h-[18px]" />
                 </button>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EditLogView({ logId, logs, onUpdate, onDelete, onBack }: any) {
  const log = logs.find((l: FoodItem) => l.id === logId);
  if (!log) return null;

  const [name, setName] = useState(log.foodName);
  const [cals, setCals] = useState(log.calories.toString());
  const [pro, setPro] = useState(log.protein.toString());
  const [notes, setNotes] = useState(log.notes || "");

  const handleSave = () => {
     onUpdate(logId, { foodName: name, calories: Number(cals) || 0, protein: Number(pro) || 0, notes });
     onBack();
  };
  
  const handleDelete = () => {
     onDelete(logId);
     onBack();
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-canvas)] overflow-y-auto z-50 absolute inset-0 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="px-4 h-[64px] flex items-center border-b border-[var(--color-hairline)] shrink-0 bg-[var(--color-canvas)] sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-[var(--color-surface-soft)] transition-colors text-[var(--color-ink)]">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-[18px] font-semibold ml-2">Edit Log</h2>
      </div>
      <div className="p-6 max-w-md mx-auto w-full space-y-6">
         <div>
           <label className="block text-[14px] font-semibold text-[var(--color-slate)] mb-2">Food Name</label>
           <Input value={name} onChange={e => setName(e.target.value)} className="font-medium" />
         </div>
         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-[14px] font-semibold text-[var(--color-slate)] mb-2">Calories</label>
             <Input type="number" value={cals} onChange={e => setCals(e.target.value)} className="font-medium" />
           </div>
           <div>
             <label className="block text-[14px] font-semibold text-[var(--color-slate)] mb-2">Protein (g)</label>
             <Input type="number" value={pro} onChange={e => setPro(e.target.value)} className="font-medium" />
           </div>
         </div>
         <div>
           <label className="block text-[14px] font-semibold text-[var(--color-slate)] mb-2">Notes</label>
           <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add specific sizes or details..." />
         </div>

         <div className="pt-6 space-y-3">
           <Button className="w-full h-12 text-[15px]" onClick={handleSave}>Save Changes</Button>
           <Button variant="secondary" className="w-full h-12 border-[var(--color-semantic-error)] text-[var(--color-semantic-error)] hover:bg-[var(--color-semantic-error)]/10 text-[15px]" onClick={handleDelete}>
             <Trash2 className="w-4 h-4 mr-2" /> Delete Entry
           </Button>
         </div>
      </div>
    </div>
  )
}

function CreateSavedView({ onSave, onBack }: any) {
  const [name, setName] = useState("");
  const [cals, setCals] = useState("");
  const [pro, setPro] = useState("");

  const handleSave = () => {
     if (!name.trim()) return;
     onSave({ foodName: name, calories: Number(cals) || 0, protein: Number(pro) || 0 });
     onBack();
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-canvas)] overflow-y-auto z-50 absolute inset-0 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="px-4 h-[64px] flex items-center border-b border-[var(--color-hairline)] shrink-0 bg-[var(--color-canvas)] sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-[var(--color-surface-soft)] transition-colors text-[var(--color-ink)]">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-[18px] font-semibold ml-2">New Preset</h2>
      </div>
      <div className="p-6 max-w-md mx-auto w-full space-y-6">
         <div>
           <label className="block text-[14px] font-semibold text-[var(--color-slate)] mb-2">Name</label>
           <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning Protein Shake" className="font-medium" />
         </div>
         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-[14px] font-semibold text-[var(--color-slate)] mb-2">Calories</label>
             <Input type="number" value={cals} onChange={e => setCals(e.target.value)} placeholder="0" className="font-medium" />
           </div>
           <div>
             <label className="block text-[14px] font-semibold text-[var(--color-slate)] mb-2">Protein (g)</label>
             <Input type="number" value={pro} onChange={e => setPro(e.target.value)} placeholder="0" className="font-medium" />
           </div>
         </div>

         <div className="pt-6">
           <Button className="w-full h-12 text-[15px]" onClick={handleSave} disabled={!name.trim()}>Save to Presets</Button>
         </div>
      </div>
    </div>
  )
}

function CreateManualLogView({ onSave, onBack }: any) {
  const [name, setName] = useState("");
  const [cals, setCals] = useState("");
  const [pro, setPro] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
     if (!name.trim()) return;
     onSave({ 
       foodName: name, 
       calories: Number(cals) || 0, 
       protein: Number(pro) || 0,
       confidence: "Manual",
       notes,
       imageUrl: ""
     });
     onBack();
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-canvas)] overflow-y-auto z-50 absolute inset-0 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="px-4 h-[64px] flex items-center border-b border-[var(--color-hairline)] shrink-0 bg-[var(--color-canvas)] sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-[var(--color-surface-soft)] transition-colors text-[var(--color-ink)]">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-[18px] font-semibold ml-2">Manual Entry</h2>
      </div>
      <div className="p-6 max-w-md mx-auto w-full space-y-6">
         <div>
           <label className="block text-[14px] font-semibold text-[var(--color-slate)] mb-2">Food Name</label>
           <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Scrambled Eggs" className="font-medium" />
         </div>
         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-[14px] font-semibold text-[var(--color-slate)] mb-2">Calories</label>
             <Input type="number" value={cals} onChange={e => setCals(e.target.value)} placeholder="0" className="font-medium" />
           </div>
           <div>
             <label className="block text-[14px] font-semibold text-[var(--color-slate)] mb-2">Protein (g)</label>
             <Input type="number" value={pro} onChange={e => setPro(e.target.value)} placeholder="0" className="font-medium" />
           </div>
         </div>
         <div>
           <label className="block text-[14px] font-semibold text-[var(--color-slate)] mb-2">Notes (Optional)</label>
           <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. cooked with 1tbsp oil" />
         </div>

         <div className="pt-6">
           <Button className="w-full h-12 text-[15px]" onClick={handleSave} disabled={!name.trim()}>Log Entry</Button>
         </div>
      </div>
    </div>
  );
}

function StatsView({ logs }: { logs: FoodItem[] }) {
  const last7DaysKeys = useMemo(() => {
    return Array.from({length: 7}).map((_, i) => {
        return getNutritionDayKey(Date.now() - (i * 24 * 60 * 60 * 1000));
    }).reverse();
  }, []);

  const chartData = useMemo(() => {
    return last7DaysKeys.map(key => {
      const dayLogs = logs.filter(l => getNutritionDayKey(l.timestamp) === key);
      const cals = dayLogs.reduce((sum, l) => sum + (l.calories || 0), 0);
      const pro = dayLogs.reduce((sum, l) => sum + (l.protein || 0), 0);
      return { key, cals, pro };
    });
  }, [logs, last7DaysKeys]);

  const avgCals = Math.round(chartData.reduce((s, d) => s + d.cals, 0) / 7) || 0;
  const avgPro = Math.round(chartData.reduce((s, d) => s + d.pro, 0) / 7) || 0;
  const maxCals = Math.max(...chartData.map(d => d.cals), 2000);

  return (
    <div className="flex-1 flex flex-col pb-28 overflow-y-auto bg-[var(--color-surface)] w-full">
      <div className="bg-[var(--color-canvas)] px-6 py-5 border-b border-[var(--color-hairline)] sticky top-0 z-10 shadow-sm">
        <h2 className="text-[22px] font-semibold tracking-tight">Last 7 Days</h2>
      </div>
      <div className="p-5 max-w-md mx-auto w-full space-y-6">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--color-canvas)] rounded-[var(--radius-lg)] p-4 border border-[var(--color-hairline)] flex flex-col justify-center">
             <p className="text-[var(--color-slate)] text-[12px] font-bold mb-1 uppercase tracking-wider">Avg Calories</p>
             <div className="flex items-baseline gap-1">
               <span className="text-[28px] font-semibold text-[var(--color-charcoal)] leading-none tracking-tight">{avgCals}</span>
             </div>
          </div>
          <div className="bg-[var(--color-canvas)] rounded-[var(--radius-lg)] p-4 border border-[var(--color-hairline)] flex flex-col justify-center">
             <p className="text-[var(--color-slate)] text-[12px] font-bold mb-1 uppercase tracking-wider">Avg Protein</p>
             <div className="flex items-baseline gap-1">
               <span className="text-[28px] font-semibold text-[var(--color-charcoal)] leading-none tracking-tight">{avgPro}</span>
               <span className="text-[var(--color-slate)] font-medium text-[13px] ml-1">g</span>
             </div>
          </div>
        </div>

        <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-[var(--radius-lg)] p-6 shadow-sm">
          <h3 className="text-[16px] font-semibold mb-6">Calorie Intake</h3>
          <div className="h-[200px] flex items-end justify-between gap-3">
            {chartData.map((d) => {
              const heightPercentage = Math.min((d.cals / maxCals) * 100, 100);
              const isToday = d.key === getNutritionDayKey(Date.now());
              
              return (
                <div key={d.key} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                   <div className="w-full bg-[var(--color-hairline-soft)] rounded-t-[4px] relative flex-1 flex items-end overflow-hidden">
                      <div 
                        className={`w-full rounded-t-[4px] transition-all duration-500 ease-out ${isToday ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-primary)]/40'}`} 
                        style={{ height: `${heightPercentage}%`, minHeight: heightPercentage > 0 ? '4px' : '0' }} 
                      />
                   </div>
                   <span className={`text-[11px] font-medium shrink-0 ${isToday ? 'text-[var(--color-ink)]' : 'text-[var(--color-steel)]'}`}>
                     {getDayOfWeek(d.key)}
                   </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
