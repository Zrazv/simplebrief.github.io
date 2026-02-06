import { FlightCategory, ParsedTaf, ForecastGroup, CloudLayer, WeatherCondition, Wind, Visibility } from './types';

// Helper to expand weather codes to plain English
const WEATHER_CODES: Record<string, string> = {
  'TS': 'Thunderstorm', 'RA': 'Rain', 'SN': 'Snow', 'SG': 'Snow Grains',
  'DZ': 'Drizzle', 'GR': 'Hail', 'GS': 'Small Hail', 'PL': 'Ice Pellets',
  'FG': 'Fog', 'BR': 'Mist', 'HZ': 'Haze', 'FU': 'Smoke', 'DU': 'Dust',
  'SA': 'Sand', 'SQ': 'Squall', 'FC': 'Funnel Cloud', 'SS': 'Sandstorm',
  'DS': 'Duststorm', 'VA': 'Volcanic Ash', 'BC': 'Patches', 'BL': 'Blowing',
  'DR': 'Low Drifting', 'FZ': 'Freezing', 'MI': 'Shallow', 'PR': 'Partial',
  'SH': 'Showers', 'VC': 'Vicinity', '-': 'Light', '+': 'Heavy'
};

function decodeWeather(code: string): string {
  if (!code) return '';
  let desc = '';
  let remaining = code;

  // Intensity
  if (remaining.startsWith('-')) { desc += 'Light '; remaining = remaining.substring(1); }
  else if (remaining.startsWith('+')) { desc += 'Heavy '; remaining = remaining.substring(1); }

  // Descriptor
  if (remaining.startsWith('VC')) { desc += 'Vicinity '; remaining = remaining.substring(2); }
  if (remaining.startsWith('MI')) { desc += 'Shallow '; remaining = remaining.substring(2); }
  if (remaining.startsWith('BC')) { desc += 'Patches of '; remaining = remaining.substring(2); }
  if (remaining.startsWith('DR')) { desc += 'Low Drifting '; remaining = remaining.substring(2); }
  if (remaining.startsWith('BL')) { desc += 'Blowing '; remaining = remaining.substring(2); }
  if (remaining.startsWith('SH')) { desc += 'Showers of '; remaining = remaining.substring(2); }
  if (remaining.startsWith('TS')) { desc += 'Thunderstorm with '; remaining = remaining.substring(2); }
  if (remaining.startsWith('FZ')) { desc += 'Freezing '; remaining = remaining.substring(2); }

  // Phenomena (iterate through known codes)
  // Simple approach: match 2-char chunks
  while (remaining.length >= 2) {
    const chunk = remaining.substring(0, 2);
    if (WEATHER_CODES[chunk]) {
      desc += WEATHER_CODES[chunk] + ' ';
      remaining = remaining.substring(2);
    } else {
      break; 
    }
  }
  
  if (desc.trim() === 'Thunderstorm with') return 'Thunderstorm';
  
  return desc.trim();
}

function calculateFlightCategory(vis: Visibility | undefined, clouds: CloudLayer[]): FlightCategory {
  let ceiling = 99999;

  // Find ceiling (lowest BKN or OVC or VV)
  for (const layer of clouds) {
    if ((layer.coverage === 'BKN' || layer.coverage === 'OVC' || layer.coverage === 'VV') && layer.altitude !== undefined) {
      if (layer.altitude < ceiling) ceiling = layer.altitude;
    }
  }

  // Australian VFR Minima
  // Ceiling >= 1500ft (15 in TAF units)
  // Visibility >= 8km (8000m)
  
  const visMeters = vis ? vis.meters : 10000;
  
  if (visMeters < 8000 || ceiling < 15) return 'IFR';

  return 'VFR';
}

function checkAlternateRequirement(group: ForecastGroup): boolean {
  // Alternate Minima: 1500ft / 8km
  let ceiling = 99999;
  for (const layer of group.clouds) {
    if ((layer.coverage === 'BKN' || layer.coverage === 'OVC' || layer.coverage === 'VV') && layer.altitude !== undefined) {
      if (layer.altitude < ceiling) ceiling = layer.altitude;
    }
  }

  const visMeters = group.visibility ? group.visibility.meters : 10000;
  
  // Cloud: More than scattered (SCT) below 1500ft
  if (ceiling < 15) return true;
  
  // Visibility: Less than 8km
  if (visMeters < 8000) return true;
  
  // PROB30/40 of conditions below minima
  if (group.type.startsWith('PROB') && (group.probability || 0) >= 30) {
    // If it's a PROB group, it already implies potential for these conditions
    return true;
  }

  // Thunderstorms (TS)
  if (group.weather.some(wx => wx.code.includes('TS'))) return true;

  return false;
}

function determineImpacts(group: ForecastGroup): string[] {
  const impacts: string[] = [];
  
  if (group.flightCategory === 'IFR') impacts.push('Below VFR Minima');
  if (group.alternateRequired) impacts.push('Alternate Required');

  if (group.wind) {
    if (group.wind.speed > 20) impacts.push('Strong Winds');
    if (group.wind.gusts && group.wind.gusts > 25) impacts.push(`Gusts ${group.wind.gusts}kt`);
    if (group.wind.direction === 'VRB') impacts.push('Variable Winds');
  }

  group.weather.forEach(wx => {
    if (wx.code.includes('TS')) impacts.push('Thunderstorms');
    if (wx.code.includes('FZ')) impacts.push('Freezing Precip');
    if (wx.code.includes('GR') || wx.code.includes('GS')) impacts.push('Hail');
    if (wx.code.includes('FG')) impacts.push('Fog');
    if (wx.code.includes('SN')) impacts.push('Snow');
    if (wx.code.includes('+RA')) impacts.push('Heavy Rain');
  });

  return impacts;
}

export function parseTaf(raw: string): ParsedTaf {
  // ... existing clean input ...
  const cleanRaw = raw.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  // 1. Extract Station
  const stationMatch = cleanRaw.match(/\b([A-Z]{4})\b/);
  const station = stationMatch ? stationMatch[1] : 'UNKNOWN';

  // 2. Extract Validity
  const validityMatch = cleanRaw.match(/(\d{2})(\d{2})\/(\d{2})(\d{2})/);
  const validity = validityMatch ? {
    startDay: parseInt(validityMatch[1]),
    startHour: parseInt(validityMatch[2]),
    endDay: parseInt(validityMatch[3]),
    endHour: parseInt(validityMatch[4]),
    raw: validityMatch[0]
  } : { startDay: 0, startHour: 0, endDay: 0, endHour: 0, raw: 'UNKNOWN' };

  // ... group splitting logic ...
  const tokens = cleanRaw.split(' ');
  const groupStrings: string[] = [];
  let currentGroup: string[] = [];
  
  tokens.forEach(token => {
    if (token.match(/^FM\d{6}$/) || ['BECMG', 'TEMPO', 'PROB30', 'PROB40'].includes(token)) {
      if (currentGroup.length > 0) groupStrings.push(currentGroup.join(' '));
      currentGroup = [token];
    } else {
      currentGroup.push(token);
    }
  });
  if (currentGroup.length > 0) groupStrings.push(currentGroup.join(' '));

  const groups: ForecastGroup[] = groupStrings.map((text, index) => {
    const type = index === 0 ? 'BASE' : (text.split(' ')[0].replace(/\d+$/, '') as any);
    const isFM = text.startsWith('FM');
    
    // Time and Prob parsing (keep as is)
    let startDay, startHour, startMinute;
    if (isFM) {
      const timeStr = text.split(' ')[0].substring(2);
      startDay = parseInt(timeStr.substring(0, 2));
      startHour = parseInt(timeStr.substring(2, 4));
      startMinute = parseInt(timeStr.substring(4, 6));
    }
    let probability;
    if (text.startsWith('PROB')) {
       probability = parseInt(text.substring(4, 6));
    }
    const timeGroup = text.match(/\b(\d{2})(\d{2})\/(\d{2})(\d{2})\b/);
    let groupStartDay, groupStartHour, groupEndDay, groupEndHour;
    if (timeGroup && !isFM) {
       groupStartDay = parseInt(timeGroup[1]);
       groupStartHour = parseInt(timeGroup[2]);
       groupEndDay = parseInt(timeGroup[3]);
       groupEndHour = parseInt(timeGroup[4]);
    }

    // Wind/Vis/Cloud/Weather parsing (keep as is but fix NM display if needed)
    const windMatch = text.match(/\b(\d{3}|VRB)(\d{2})(G(\d{2}))?(KT|MPS)\b/);
    let wind: Wind | undefined;
    if (windMatch) {
      wind = {
        direction: windMatch[1],
        speed: parseInt(windMatch[2]),
        gusts: windMatch[4] ? parseInt(windMatch[4]) : undefined,
        unit: windMatch[5] as 'KT' | 'MPS'
      };
    }

    let visibility: Visibility | undefined;
    const p6sm = text.match(/\bP6SM\b/);
    if (p6sm) {
      visibility = { meters: 10000, raw: 'P6NM' };
    } else {
      const smMatch = text.match(/\b(\d+(?:\/\d+)?|M?\d+\s\d+\/\d+)SM\b/);
      if (smMatch) {
         const rawNM = smMatch[0].replace('SM', 'NM');
         visibility = { meters: 9999, raw: rawNM };
         if (smMatch[0] === '10SM') visibility.meters = 18520;
         else if (parseInt(smMatch[0]) < 3) visibility.meters = 5000;
      } else {
        const metersMatch = text.match(/\b(\d{4})\b/);
        if (metersMatch && !metersMatch[0].startsWith('20') && !text.includes('FM'+metersMatch[0])) { 
           const m = parseInt(metersMatch[0]);
           if (windMatch && text.indexOf(metersMatch[0]) > text.indexOf(windMatch[0])) {
               const nm = Math.round(m / 1852 * 10) / 10;
               visibility = { meters: m, raw: `${nm}NM` };
           }
        }
      }
    }
    
    const clouds: CloudLayer[] = [];
    const cloudMatches = Array.from(text.matchAll(/\b(FEW|SCT|BKN|OVC|VV)(\d{3})(CB|TCU)?\b/g));
    for (const match of cloudMatches) {
      clouds.push({
        coverage: match[1] as any,
        altitude: parseInt(match[2]),
        type: match[3]
      });
    }
    if (text.includes('SKC') || text.includes('NSC')) {
       clouds.push({ coverage: text.includes('SKC') ? 'SKC' : 'NSC' });
    }

    const weather: WeatherCondition[] = [];
    const tokens = text.split(' ');
    tokens.forEach(t => {
      if (['TS', 'RA', 'SN', 'BR', 'FG', 'HZ'].some(c => t.includes(c)) && !t.match(/^(FM|BECMG|TEMPO|PROB)/)) {
        if (t.length < 8 && !t.match(/\d{4}\/\d{4}/)) {
           const desc = decodeWeather(t);
           if (desc) weather.push({ code: t, description: desc });
        }
      }
    });

    const flightCategory = calculateFlightCategory(visibility, clouds);
    
    const group: ForecastGroup = {
      type: type === 'BASE' ? 'BASE' : (isFM ? 'FM' : type as any),
      rawText: text,
      wind,
      visibility,
      clouds,
      weather,
      flightCategory,
      alternateRequired: false, // will set below
      impacts: [],
      startDay: isFM ? startDay : groupStartDay,
      startHour: isFM ? startHour : groupStartHour,
      startMinute: isFM ? startMinute : 0,
      endDay: groupEndDay,
      endHour: groupEndHour,
      probability
    };
    
    group.alternateRequired = checkAlternateRequirement(group);
    group.impacts = determineImpacts(group);
    
    return group;
  });

  const maxImpact = groups.some(g => g.flightCategory === 'IFR') ? 'IFR' : 'VFR';
  const alternateRequired = groups.some(g => g.alternateRequired);

  return {
    station,
    validity,
    rawText: cleanRaw,
    groups,
    maxImpact,
    alternateRequired
  };
}
