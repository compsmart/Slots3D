import { create } from 'zustand';
import symbolMapData from './symbolMap.json';

import spinSound from './assets/sounds/spin.mp3';
import winSound from './assets/sounds/win.mp3';
import bigWinSound from './assets/sounds/big-win.mp3';
import buttonSound from './assets/sounds/button-click.mp3';

const audio = {
  spin: new Audio(spinSound),
  win: new Audio(winSound),
  bigWin: new Audio(bigWinSound),
  click: new Audio(buttonSound)
};

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
  isBonusActive: boolean; // True when bonus is triggered (for next spin)
  isBonusSpin: boolean; // True when currently IN a bonus spin
  winningRows: number[]; // New: Store which rows matched for UI flashing
  
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
  { id: 'diamond', name: 'Diamond', texture: '💎', multiplier: 20, color: '#00ffff' },
  { id: 'seven', name: 'Seven', texture: '7️⃣', multiplier: 50, color: '#ff00ff' },
  { id: 'bonus', name: 'Bonus', texture: '⭐', multiplier: 0, color: '#ffaa00' },
  // Kept for compatibility if old map used, but new map won't use them
  { id: 'lemon', name: 'Lemon', texture: '🍋', multiplier: 3, color: '#ffff00' },
  { id: 'grape', name: 'Grape', texture: '🍇', multiplier: 5, color: '#800080' },
  { id: 'bell', name: 'Bell', texture: '🔔', multiplier: 10, color: '#ffd700' },
];

export const useGameStore = create<GameState>((set, get) => ({
  balance: 1000,
  bet: 10,
  status: 'idle',
  reels: [0, 0, 0, 0, 0],
  targetPositions: [0, 0, 0, 0, 0],
  winAmount: 0,
  isBonusActive: false, // Bonus triggered for next spin
  isBonusSpin: false, // Currently in bonus spin
  winningRows: [],
  
  symbols: DEFAULT_SYMBOLS,
  reelCount: 5,
  symbolsPerReel: 50, // Total segments
  reelStrips: symbolMapData.reels, // Load from JSON

  setBet: (amount) => {
    audio.click.currentTime = 0;
    audio.click.play().catch(() => {});
    set({ bet: Math.max(1, amount) });
  },
  
  spin: () => {
    audio.click.currentTime = 0;
    audio.click.play().catch(() => {});
    
    const { balance, bet, status, symbolsPerReel, reelCount } = get();
    if (status !== 'idle' && status !== 'win' && status !== 'lose') return;
    if (balance < bet) {
      alert("Insufficient funds!");
      return;
    }
    
    // Play Spin Sound
    audio.spin.currentTime = 0;
    audio.spin.loop = true;
    audio.spin.play().catch(() => {});
    
    // Determine results immediately
    const newTargets = Array.from({ length: reelCount }, () => 
      Math.floor(Math.random() * symbolsPerReel)
    );

    const { isBonusActive } = get();
    
    set({ 
      balance: balance - bet, 
      status: 'spinning', 
      winAmount: 0,
      targetPositions: newTargets,
      isBonusSpin: isBonusActive, // Set to true if bonus was triggered, false otherwise
      isBonusActive: false // Clear the flag (we're using it now)
    });
  },

  completeSpin: () => {
    // Stop Spin Sound
    audio.spin.pause();
    audio.spin.currentTime = 0;

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
    
    // Helper for standard left-to-right win logic
    const calculateLineWin = (ids: string[]) => {
        if (ids.length === 0) return 0;
        const firstId = ids[0];
        
        let matchCount = 1;
        for (let i = 1; i < ids.length; i++) {
            if (ids[i] === firstId) matchCount++;
            else break; // Stop at first mismatch
        }
        
        if (matchCount >= 3 && firstId !== 'bonus') {
             const sConf = symbols.find(s => s.id === firstId);
             if (sConf) {
                 return bet * sConf.multiplier * (matchCount - 2);
             }
        }
        return 0;
    };

    // Standard Line Win (Center)
    let win = calculateLineWin(resultSymbolIds);
    const currentWinningRows: number[] = [];
    if (win > 0) currentWinningRows.push(0); // 0 offset = center row match

    // Bonus Feature Win Evaluation
    // "EVERY single line across the 5 reels is a winning payline"
    // This implies the CURRENT spin becomes a bonus spin, OR the next one does.
    // Logic: If triggeredBonus, we set flag. If isBonusActive, we eval all lines.
    
    // Let's just award a big bonus amount for now and toggle the state so UI can show lines.
    if (triggeredBonus) {
        // Trigger bonus mode, but NO immediate payout
    } else if (isBonusActive) {
       // This IS the bonus spin
       console.log("--- BONUS SPIN EVALUATION ---");
       let totalBonusWin = 0;
       
       // Iterate all rows
       for(let offset = 0; offset < symbolsPerReel; offset++) {
           // Calculate symbols at this offset
           const rowIds = targetPositions.map((pos, rI) => {
               const strip = reelStrips[rI];
               // (pos + offset) % length
               return strip[(pos + offset) % strip.length];
           });
           
           // Check win for this row using standard left-to-right logic
           const lineWin = calculateLineWin(rowIds);
           
           if (lineWin > 0) {
               totalBonusWin += lineWin;
               currentWinningRows.push(offset); // Add this offset to winning rows
               const fId = rowIds[0];
               // Re-calculate match count just for logging
               let mCount = 1;
               for (let k = 1; k < rowIds.length; k++) if (rowIds[k] === fId) mCount++; else break;
               console.log(`Row ${offset}: ${mCount}x ${fId} - Win: ${lineWin}`);
           }
       }
       console.log(`Total Bonus Win: ${totalBonusWin}`);
       win = totalBonusWin;
    }

    if (win > 0) {
        console.log(`WIN DETECTED: ${win}`);
        // Play Win Sound based on amount (threshold for Big Win)
        const isBigWin = win >= bet * 10;
        if (isBigWin) {
            audio.bigWin.currentTime = 0;
            audio.bigWin.play().catch(() => {});
        } else {
            audio.win.currentTime = 0;
            audio.win.play().catch(() => {});
        }
    } else {
        console.log("No Win.");
    }

    set((state) => ({ 
      status: win > 0 ? 'win' : 'idle',
      winAmount: win,
      balance: state.balance + win,
      reels: targetPositions,
      isBonusActive: triggeredBonus ? true : false, // Set for NEXT spin if triggered
      isBonusSpin: state.isBonusSpin, // Keep bonus spin flag during win state
      winningRows: currentWinningRows
    }));
    
    // Keep isBonusSpin true during win state so lines stay visible
    // It will be cleared when a new spin starts (if not a bonus spin)
  }
}));

