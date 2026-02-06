import { ParsedTaf, ForecastGroup } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock } from "lucide-react";

interface ForecastTimelineProps {
  taf: ParsedTaf;
}

export function ForecastTimeline({ taf }: ForecastTimelineProps) {
  
  const getGroupColor = (cat: string) => {
     switch(cat) {
       case 'VFR': return 'bg-green-500/10 text-green-400 border-green-500/20';
       case 'IFR': return 'bg-red-500/10 text-red-400 border-red-500/20';
       default: return 'bg-slate-800 text-slate-400';
     }
  };

  const formatTime = (group: ForecastGroup) => {
    if (group.type === 'FM') {
      return `FROM ${String(group.startHour).padStart(2, '0')}:${String(group.startMinute).padStart(2, '0')}Z`;
    }
    if (group.type === 'BECMG') {
      return `BECOMING ${String(group.startHour).padStart(2, '0')}-${String(group.endHour).padStart(2, '0')}Z`;
    }
    if (group.type === 'TEMPO') {
      return `TEMPO ${String(group.startHour).padStart(2, '0')}-${String(group.endHour).padStart(2, '0')}Z`;
    }
    if (group.type.startsWith('PROB')) {
       return `${group.type} ${String(group.startHour).padStart(2, '0')}-${String(group.endHour).padStart(2, '0')}Z`;
    }
    return `VALID ${taf.validity.raw}`;
  };

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-black/20">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Briefing Timeline
        </h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-white/10" />
          
          {taf.groups.map((group, idx) => (
            <div key={idx} className="relative pl-10 group">
              {/* Dot */}
              <div className={`absolute left-[14px] top-3 w-3 h-3 rounded-full border-2 border-slate-900 z-10 ${
                 group.flightCategory === 'VFR' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              
              <div className="bg-white/5 border border-white/5 rounded-lg p-4 transition-all hover:bg-white/10 hover:border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-300 font-bold tracking-wider">
                      {formatTime(group)}
                    </span>
                    {group.alternateRequired && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">
                        ALT REQ
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className={`${getGroupColor(group.flightCategory)} font-mono`}>
                    {group.flightCategory}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-2 text-sm text-slate-300">
                  {group.wind && (
                     <div className="flex items-center gap-2">
                        <span className="text-slate-500 w-12 uppercase text-[10px]">Wind</span>
                        <span className="font-mono">
                           {group.wind.direction === 'VRB' ? 'VRB' : group.wind.direction}° / {group.wind.speed}kt
                           {group.wind.gusts && <span className="text-amber-400"> G{group.wind.gusts}</span>}
                        </span>
                     </div>
                  )}
                  
                  {group.visibility && (
                     <div className="flex items-center gap-2">
                        <span className="text-slate-500 w-12 uppercase text-[10px]">Vis</span>
                        <span className="font-mono">{group.visibility.raw}</span>
                     </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 w-12 uppercase text-[10px] mt-0.5">Sky</span>
                    <div className="flex flex-wrap gap-1">
                      {group.clouds.length > 0 ? group.clouds.map((c, i) => (
                        <span key={i} className="font-mono bg-black/30 px-1 rounded text-xs">
                          {c.coverage}{c.altitude ? String(c.altitude).padStart(3, '0') : ''}{c.type || ''}
                        </span>
                      )) : <span className="font-mono text-slate-500">NSW</span>}
                    </div>
                  </div>

                  {group.weather.length > 0 && (
                     <div className="flex items-start gap-2">
                        <span className="text-slate-500 w-12 uppercase text-[10px] mt-0.5">Wx</span>
                        <div className="flex flex-wrap gap-1">
                          {group.weather.map((w, i) => (
                             <span key={i} className="text-white font-medium">{w.description}</span>
                          ))}
                        </div>
                     </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
