import { create } from 'zustand';
import symbolMapData from './symbolMap.json';

export type SymbolConfig = {
  id: string;
  name: string;
  texture: string; // URL or Emoji char for canvas generation
  multiplier: number;
  color: string;
};

export type GameStatus = 'idle' | 'spinning' | 'stopping' | 'win' | 'lose';

interface GameState {
  balance: number;
  bet: number;
  status: GameStatus;
  reels: number[]; // Current rotation/index of each reel
  winAmount: number;
  isBonusActive: boolean;
  
  // Config
  symbols: SymbolConfig[];
  reelCount: number;
  symbolsPerReel: number;
  reelStrips: string[][]; // Mapped symbol IDs for each reel

  targetPositions: number[]; // Target stop index for each reel
  
  // Actions
  setBet: (amount: number) => void;
  spin: () => void;
  completeSpin: () => void;
}

// Default Symbols
const DEFAULT_SYMBOLS: SymbolConfig[] = [
  { id: 'cherry', name: 'Cherry', texture: '🍒', multiplier: 2, color: '#ff0000' },
  { id: 'lemon', name: 'Lemon', texture: '🍋', multiplier: 3, color: '#ffff00' },
  { id: 'grape', name: 'Grape', texture: '🍇', multiplier: 5, color: '#800080' },
  { id: 'bell', name: 'Bell', texture: '🔔', multiplier: 10, color: '#ffd700' },
  { id: 'diamond', name: 'Diamond', texture: '💎', multiplier: 20, color: '#00ffff' },
  { id: 'seven', name: 'Seven', texture: '7️⃣', multiplier: 50, color: '#ff00ff' },
  { id: 'bonus', name: 'Bonus', texture: '⭐', multiplier: 0, color: '#ffaa00' },
];

export const useGameStore = create<GameState>((set, get) => ({
  balance: 1000,
  bet: 10,
  status: 'idle',
  reels: [0, 0, 0, 0, 0],
  targetPositions: [0, 0, 0, 0, 0],
  winAmount: 0,
  isBonusActive: false, // New state
  
  symbols: DEFAULT_SYMBOLS,
  reelCount: 5,
  symbolsPerReel: 50, // Total segments
  reelStrips: symbolMapData.reels, // Load from JSON

  setBet: (amount) => set({ bet: Math.max(1, amount) }),
  
  spin: () => {
    const { balance, bet, status, symbolsPerReel, reelCount } = get();
    if (status !== 'idle' && status !== 'win' && status !== 'lose') return;
    if (balance < bet) {
      alert("Insufficient funds!");
      return;
    }
    
    // Determine results immediately
    const newTargets = Array.from({ length: reelCount }, () => 
      Math.floor(Math.random() * symbolsPerReel)
    );

    set({ 
      balance: balance - bet, 
      status: 'spinning', 
      winAmount: 0,
      targetPositions: newTargets
    });
  },

  completeSpin: () => {
    const { targetPositions, symbols, reelStrips, bet, isBonusActive, symbolsPerReel } = get();
    
    // Get the symbol ID at the target position for each reel
    const resultSymbolIds = targetPositions.map((pos, reelIndex) => {
        // The 'pos' is the index on the strip (0-49)
        const strip = reelStrips[reelIndex];
        return strip[pos % strip.length];
    });

    // Check if Bonus landed on Payline (Center)
    // If ANY bonus is on the line? Or specific amount? 
    // Query says "if the play lands a bonus symbol on the payline it will activate a bonus feature"
    // implying even one might trigger it, OR usually it is 3+.
    // Let's assume 1 triggers it for high visibility based on "EVERY single line... is a winning payline"
    // Actually, standard slot logic is 3 scatters. But the user said "lands A bonus symbol".
    // Let's do: If >= 1 bonus symbol is on the center payline.
    
    const bonusCount = resultSymbolIds.filter(id => id === 'bonus').length;
    const triggeredBonus = bonusCount >= 1; // Configure as needed
    
    // Standard Line Win (Center)
    // Check for matches (simple line check)
    const firstId = resultSymbolIds[0];
    let matchCount = 1;
    for (let i = 1; i < resultSymbolIds.length; i++) {
        if (resultSymbolIds[i] === firstId) matchCount++;
        else break;
    }

    let win = 0;
    // Regular Win
    if (matchCount >= 3 && firstId !== 'bonus') { // Don't pay regular line for bonus unless specified
      const symbolConfig = symbols.find(s => s.id === firstId);
      if (symbolConfig) {
          win = bet * symbolConfig.multiplier * (matchCount - 2);
      }
    }

    // Bonus Feature Win Evaluation
    // "EVERY single line across the 5 reels is a winning payline"
    // This sounds like "All-Ways" or just lots of lines. 
    // Or does it mean horizontal rows? 
    // "We should show all the paylines as green lines when active."
    
    // If bonus is active (triggered THIS spin), we calculate the "Bonus Win".
    // Let's interpret "Every single line" as: We pay out for the center line (already done),
    // PLUS we check Top and Bottom rows? Or just pay a huge multiplier?
    
    // Interpretation: The user wants a visual effect "Green lines" and a payout.
    // Let's simulate a "Win All Ways" or "Full Reel Win".
    // For MVP: If bonus is hit, we award a flat bonus prize OR
    // we treat the current spin as having winning lines everywhere.
    
    // Let's just award a big bonus amount for now and toggle the state so UI can show lines.
    if (triggeredBonus) {
        // Trigger bonus mode, but NO immediate payout
        // The NEXT spin (or current spin re-evaluated?)
        // Query says: "it enters the bonus round for spin where every single row is a valid payline."
        // This implies the CURRENT spin becomes a bonus spin, OR the next one does.
        // "if the play lands a bonus symbol ... it will activate a bonus feature."
        
        // Let's assume it activates the feature state, and the USER must spin again to get the "All Lines" benefit?
        // OR, does the current result get evaluated with "All Lines"?
        // "enters the bonus round for spin" -> singular. Maybe the NEXT spin.
        
        // Implementation:
        // 1. Land Bonus -> Win 0 (unless regular line wins), set isBonusActive = true.
        // 2. User spins again -> isBonusActive is true -> Eval ALL lines -> Reset isBonusActive.
        
        // Wait, if I land a bonus, I expect a "Free Spin" or just "Next Spin is Super".
        // Let's make it: Trigger Bonus -> No Payout (Win 0) -> Set Flag.
        // Next Spin -> Check Flag -> Use "All Lines" math -> Clear Flag.
    } else if (isBonusActive) {
       // This IS the bonus spin
       // Evaluate all lines (50 lines)
       // For MVP, let's just say every match on the center line is multiplied by 50 (rows).
       // Or actually iterate all rows? We don't have the full reel strip visible in state easily without calc.
       // Actually we DO have 'reelStrips'.
       
       // Simplified "All Rows" logic:
       // Just take the center line win and multiply by 50? 
       // No, that's cheating.
       // But since the reels are random, the probability is equal for all rows.
       // Let's just multiply the center line win by random factor or just 50 for visual impact?
       // Real implementation: Iterate offsets 0..49.
       
       let totalBonusWin = 0;
       for(let offset = 0; offset < symbolsPerReel; offset++) {
           // Calculate symbols at this offset
           const rowIds = targetPositions.map((pos, rI) => {
               const strip = reelStrips[rI];
               // (pos + offset) % length
               return strip[(pos + offset) % strip.length];
           });
           
           // Check win for this row
           const fId = rowIds[0];
           let mCount = 1;
           for (let k = 1; k < rowIds.length; k++) {
               if (rowIds[k] === fId) mCount++;
               else break;
           }
           
           if (mCount >= 3 && fId !== 'bonus') {
               const sConf = symbols.find(s => s.id === fId);
               if (sConf) totalBonusWin += bet * sConf.multiplier * (mCount - 2);
           }
       }
       win = totalBonusWin;
    }

    set((state) => ({ 
      status: win > 0 ? 'win' : 'idle',
      winAmount: win,
      balance: state.balance + win,
      reels: targetPositions,
      isBonusActive: triggeredBonus ? true : false // Activate if triggered, deactivate if we just used it (was active)
    }));
  }
}));

