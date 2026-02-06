import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Plane, Check } from "lucide-react";

interface TafInputProps {
  onParse: (raw: string) => void;
}

export function TafInput({ onParse }: TafInputProps) {
  const [input, setInput] = useState("YPJT 061130Z 0612/0712 02012KT 9999 SCT010 BKN015 FM061500 01015G25KT 5000 -RA BR BKN010 BECMG 0620/0622 34020G30KT PROB30 0700/0704 2000 TSRA OVC009CB");

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-800/50 border border-slate-700 mb-4 shadow-lg shadow-black/50">
          <Plane className="w-8 h-8 text-primary rotate-[-45deg]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
          SIMPLE <span className="text-primary">BRIEF</span>
        </h1>
        <p className="text-slate-400 max-w-md mx-auto">
          Intelligent aviation weather analysis. Paste a raw TAF to get started.
        </p>
      </div>

      <div className="glass-panel p-2 rounded-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/50 focus-within:bg-black/60">
        <Textarea 
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="PASTE TAF HERE..." 
          className="min-h-[120px] bg-transparent border-none text-lg font-mono text-white placeholder:text-slate-600 focus-visible:ring-0 resize-none p-4"
        />
        <div className="flex justify-between items-center px-4 pb-2">
           <span className="text-xs text-slate-500 font-mono">SUPPORTS ICAO FORMAT</span>
           <Button 
             onClick={() => onParse(input)}
             className="bg-primary hover:bg-white text-black font-bold tracking-wide"
           >
             ANALYSE <Check className="w-4 h-4 ml-2" />
           </Button>
        </div>
      </div>
      
      <div className="flex gap-4 justify-center mt-8">
        <div className="flex items-center gap-2 text-xs text-slate-500">
           <div className="w-2 h-2 rounded-full bg-green-500"></div> VFR
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
           <div className="w-2 h-2 rounded-full bg-red-500"></div> IFR
        </div>
      </div>
    </div>
  );
}
