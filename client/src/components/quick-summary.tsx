import { Card, CardContent } from "@/components/ui/card";
import { ParsedTaf } from "@/lib/types";
import { AlertCircle, CheckCircle2, AlertTriangle, Wind, Eye, CloudRain, Clock } from "lucide-react";

interface QuickSummaryProps {
  taf: ParsedTaf;
}

export function QuickSummary({ taf }: QuickSummaryProps) {
  // Generate a plain English summary based on the parsed data
  
  const generateSummary = () => {
    if (!taf.groups.length) return "No forecast data available.";
    
    const base = taf.groups[0];
    const changes = taf.groups.slice(1);
    
    let summary = `Forecast for ${taf.station}. Starts with ${base.flightCategory} conditions. `;
    
    // Wind summary
    if (base.wind) {
      summary += `Winds from ${base.wind.direction === 'VRB' ? 'variable directions' : base.wind.direction + '°'} at ${base.wind.speed} knots`;
      if (base.wind.gusts) summary += ` gusting to ${base.wind.gusts} knots`;
      summary += `. `;
    } else {
      summary += `Winds calm or not specified. `;
    }
    
    // Significant weather
    const allWx = new Set<string>();
    taf.groups.forEach(g => g.weather.forEach(w => allWx.add(w.description)));
    
    if (allWx.size > 0) {
      summary += `Expect ${Array.from(allWx).join(', ').toLowerCase()} during the period. `;
    } else {
      summary += `No significant weather phenomena forecast. `;
    }
    
    // Worst conditions
    const ifrGroups = taf.groups.filter(g => g.flightCategory === 'IFR');
    if (ifrGroups.length > 0) {
      summary += `Be alert for IFR conditions`;
      const times = ifrGroups.map(g => {
         if (g.type === 'FM' && g.startHour !== undefined) return `after ${g.startHour}:00Z`;
         if (g.startHour !== undefined && g.endHour !== undefined) return `between ${g.startHour}Z and ${g.endHour}Z`;
         return 'temporarily';
      });
      summary += ` ${times[0]}. `;
    }

    if (taf.alternateRequired) {
      summary += `A destination alternate aerodrome is required for this flight. `;
    }
    
    return summary;
  };

  const statusColor = {
    'VFR': 'text-green-400',
    'IFR': 'text-red-400'
  }[taf.maxImpact];

  return (
    <Card className="glass-panel border-none">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Executive Summary</h2>
            <div className="flex items-baseline gap-2 mt-1">
              <h1 className="text-3xl font-display font-bold text-white tracking-wide">{taf.station}</h1>
              <span className={`text-xl font-bold font-mono ${statusColor}`}>{taf.maxImpact}</span>
              {taf.alternateRequired && (
                <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold animate-pulse">
                  ALTERNATE REQUIRED
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-mono">
              <Clock className="w-3 h-3" />
              <span>VALID {taf.validity.raw} (UTC)</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
             {taf.maxImpact === 'VFR' && !taf.alternateRequired && <CheckCircle2 className="w-8 h-8 text-green-500" />}
             {taf.alternateRequired && <AlertTriangle className="w-8 h-8 text-amber-500" />}
             {taf.maxImpact === 'IFR' && <AlertCircle className="w-8 h-8 text-red-500" />}
          </div>
        </div>
        
        <p className="text-lg leading-relaxed text-slate-200 font-light border-l-2 border-white/20 pl-4">
          {generateSummary()}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
           <div className="bg-white/5 rounded-lg p-3 flex flex-col items-center justify-center text-center">
             <Wind className="w-5 h-5 mb-1 text-slate-400" />
             <span className="text-xs text-slate-500 uppercase">Max Wind</span>
             <span className="font-mono font-bold text-white">
               {Math.max(...taf.groups.map(g => g.wind?.gusts || g.wind?.speed || 0))} KT
             </span>
           </div>
           
           <div className="bg-white/5 rounded-lg p-3 flex flex-col items-center justify-center text-center">
             <Eye className="w-5 h-5 mb-1 text-slate-400" />
             <span className="text-xs text-slate-500 uppercase">Min Vis</span>
             <span className="font-mono font-bold text-white">
                {taf.groups.some(g => g.visibility?.raw.includes('M') || (g.visibility?.meters || 9999) < 1852) ? '< 1NM' : 'P6NM'}
             </span>
           </div>
           
           <div className="bg-white/5 rounded-lg p-3 flex flex-col items-center justify-center text-center">
             <CloudRain className="w-5 h-5 mb-1 text-slate-400" />
             <span className="text-xs text-slate-500 uppercase">Precip</span>
             <span className="font-mono font-bold text-white">
                {taf.groups.some(g => g.weather.length > 0) ? 'YES' : 'NONE'}
             </span>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
