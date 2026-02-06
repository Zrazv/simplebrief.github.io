import { useState, useEffect, useRef } from "react";
import { ParsedTaf, ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface AiAssistantProps {
  taf: ParsedTaf;
}

export function AiAssistant({ taf }: AiAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `I've analysed the TAF for ${taf.station}. What can I help you with?`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const generateResponse = (query: string): string => {
    const q = query.toLowerCase();
    
    // Improved, more human-like responses
    
    if (q.includes('rain') || q.includes('precip') || q.includes('wet')) {
      const rainGroups = taf.groups.filter(g => g.weather.some(w => w.description.toLowerCase().includes('rain')));
      if (rainGroups.length === 0) return "No rain in the forecast, so you should be in the clear for any precipitation.";
      
      const times = rainGroups.map(g => {
         if (g.type === 'FM') return `from ${g.startHour}Z onwards`;
         if (g.type === 'TEMPO') return `briefly between ${g.startHour}Z and ${g.endHour}Z`;
         return 'at some point during the period';
      });
      return `It looks like we're expecting some rain ${times.join(', ')}. Keep an eye on those windows.`;
    }

    if (q.includes('wind') || q.includes('gust') || q.includes('blow')) {
      const maxWind = Math.max(...taf.groups.map(g => g.wind?.speed || 0));
      const maxGust = Math.max(...taf.groups.map(g => g.wind?.gusts || 0));
      const gustGroup = taf.groups.find(g => (g.wind?.gusts || 0) === maxGust);
      
      let response = `Winds are looking to be around ${maxWind} knots. `;
      if (maxGust > 0) {
        response += `We might see some gusts up to ${maxGust} knots ${gustGroup?.startHour ? `around ${gustGroup.startHour}Z` : 'during the flight'}.`;
      } else {
        response += "No significant gusts are showing up, which is good news.";
      }
      return response;
    }

    if (q.includes('ifr') || q.includes('low') || q.includes('cloud') || q.includes('ceiling')) {
      const ifr = taf.groups.filter(g => g.flightCategory === 'IFR');
      if (ifr.length > 0) {
        return `Heads up, we're looking at some IFR conditions. The lowest weather seems to be ${ifr[0].type === 'TEMPO' ? 'popping in and out' : 'settling in'} around ${ifr[0].startHour}Z, mainly because of ${ifr[0].clouds.length > 0 ? 'the low ceilings' : 'the visibility'}.`;
      }
      return "The clouds and visibility look solid—mostly VFR conditions throughout the period.";
    }

    if (q.includes('alternate')) {
      if (taf.alternateRequired) {
        const reasons = Array.from(new Set(taf.groups.filter(g => g.alternateRequired).flatMap(g => g.impacts.filter(i => i !== 'Alternate Required'))));
        return `Yes, you'll need to plan for an alternate. It's mainly due to ${reasons.join(' and ')}. Better safe than sorry!`;
      }
      return "Based on these numbers, you won't need an alternate today. Everything stays above the Australian VFR minima.";
    }
    
    if (q.includes('thunder') || q.includes('storm') || q.includes('ts')) {
       const ts = taf.groups.filter(g => g.weather.some(w => w.code.includes('TS')));
       if (ts.length > 0) return `Yeah, there are thunderstorms in the mix between ${ts[0].startHour}Z and ${ts[0].endHour || 'the end of the period'}Z. Definitely something to watch out for.`;
       return "I'm not seeing any thunderstorms in this forecast, so that's one less thing to worry about.";
    }

    if (q.includes('summary') || q.includes('how is it') || q.includes('overview')) {
      const condition = taf.maxImpact.toLowerCase();
      return `Overall, ${taf.station} is looking at ${condition} conditions. We've got max winds of ${Math.max(...taf.groups.map(g => g.wind?.speed || 0))}kt. Is there anything specific about the weather you're curious about?`;
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
        return "Hi there! I'm here to help you make sense of this TAF. What's on your mind?";
    }

    if (q.includes('thank')) {
        return "You're very welcome! Safe flying.";
    }
    
    return "I'm not quite sure about that, but I can tell you all about the winds, rain, visibility, or when things might get a bit bumpy. What do you want to know?";
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    
    setTimeout(() => {
      const response = generateResponse(userMsg.content);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" /> Assistant
        </h2>
        <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">BETA</span>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none'
              }`}>
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
             <div className="flex gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-slate-800/50 px-4 py-3 rounded-lg rounded-tl-none border border-slate-700/50">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      
      <div className="p-4 bg-black/20 border-t border-white/5">
        <div className="flex gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about visibility, wind, or timing..." 
            className="bg-black/40 border-slate-700 focus-visible:ring-primary/50 text-white"
          />
          <Button size="icon" onClick={handleSend} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          AI answers grounded strictly in parsed TAF data.
        </p>
      </div>
    </div>
  );
}
