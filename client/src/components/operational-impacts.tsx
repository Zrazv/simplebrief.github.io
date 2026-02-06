import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParsedTaf } from "@/lib/types";
import { AlertTriangle, Snowflake, CloudLightning, Wind, EyeOff } from "lucide-react";

interface OperationalImpactsProps {
  taf: ParsedTaf;
}

export function OperationalImpacts({ taf }: OperationalImpactsProps) {
  // Flatten all impacts from all groups
  const allImpacts = new Set<string>();
  taf.groups.forEach(g => g.impacts.forEach(i => allImpacts.add(i)));
  
  const impactsArray = Array.from(allImpacts);

  // Categorize impacts
  const severe = impactsArray.filter(i => i.includes('Thunderstorm') || i.includes('Alternate') || i.includes('Freezing') || i.includes('Gusts') || i.includes('Strong') || i.includes('Below VFR'));
  const moderate = impactsArray.filter(i => !severe.includes(i));

  if (impactsArray.length === 0) {
    return (
       <Card className="glass-panel border-none h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Operational Impacts</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
           <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
             <span className="text-green-500 font-bold">✓</span>
           </div>
           <p>No significant operational hazards forecast.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border-none h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Operational Impacts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {severe.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-red-400 uppercase">Critical / Attention Needed</h3>
            <div className="grid gap-2">
              {severe.map(impact => (
                <div key={impact} className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-2 rounded-md">
                   {impact.includes('Thunderstorm') && <CloudLightning className="w-5 h-5 text-red-400" />}
                   {impact.includes('Freezing') && <Snowflake className="w-5 h-5 text-red-400" />}
                   {impact.includes('Wind') && <Wind className="w-5 h-5 text-red-400" />}
                   {impact.includes('VFR') && <EyeOff className="w-5 h-5 text-red-400" />}
                   {impact.includes('Alternate') && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                   <span className="font-medium text-red-100">{impact}</span>
                </div>
              ))}
            </div>
          </div>
        )}

          {moderate.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase">Cautionary Items</h3>
              <div className="grid gap-2">
                {moderate.map(impact => (
                  <div key={impact} className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 p-2 rounded-md">
                     <span className="w-2 h-2 rounded-full bg-amber-500" />
                     <span className="font-medium text-amber-100">{impact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
