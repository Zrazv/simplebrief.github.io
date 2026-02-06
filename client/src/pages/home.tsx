import { useState } from "react";
import { TafInput } from "@/components/taf-input";
import { QuickSummary } from "@/components/quick-summary";
import { ForecastTimeline } from "@/components/timeline";
import { OperationalImpacts } from "@/components/operational-impacts";
import { AiAssistant } from "@/components/ai-assistant";
import { parseTaf } from "@/lib/taf-parser";
import { ParsedTaf } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedTaf | null>(null);

  const handleParse = (raw: string) => {
    try {
      const result = parseTaf(raw);
      setParsedData(result);
    } catch (e) {
      console.error(e);
      // Handle error gracefully
    }
  };

  return (
    <div className="min-h-screen pb-12 px-4 md:px-8 pt-8">
      {/* Disclaimer Banner */}
      <div className="max-w-7xl mx-auto mb-4">
        <Alert className="bg-amber-950/30 border-amber-900/50 text-amber-500 flex items-center justify-center py-2">
           <AlertCircle className="w-4 h-4 mr-2" />
           <AlertDescription className="text-xs font-mono uppercase tracking-wider">
             For Situational Awareness Only. Not a substitute for official briefing.
           </AlertDescription>
        </Alert>
        <div className="mt-2 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Created by Ziyan Razvi
          </p>
        </div>
      </div>

      {!parsedData ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <TafInput onParse={handleParse} />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
             <Button 
               variant="ghost" 
               className="text-slate-400 hover:text-white"
               onClick={() => setParsedData(null)}
             >
               <ChevronLeft className="w-4 h-4 mr-1" /> New Search
             </Button>
          </div>

          {/* Top Row: Summary & Impacts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <QuickSummary taf={parsedData} />
            </div>
            <div className="lg:col-span-1">
              <OperationalImpacts taf={parsedData} />
            </div>
          </div>

          {/* Bottom Row: Timeline & AI */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
             <div className="lg:col-span-2 h-full">
               <ForecastTimeline taf={parsedData} />
             </div>
             <div className="lg:col-span-1 h-full">
               <AiAssistant taf={parsedData} />
             </div>
          </div>
          
          <div className="p-4 bg-black/40 rounded-lg border border-white/5 mt-8">
            <h3 className="text-xs text-slate-500 font-mono mb-2 uppercase">Raw TAF Data</h3>
            <p className="font-mono text-sm text-slate-400 break-all">
              {parsedData.rawText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
