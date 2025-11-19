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
];

export const useGameStore = create<GameState>((set, get) => ({
  balance: 1000,
  bet: 10,
  status: 'idle',
  reels: [0, 0, 0, 0, 0],
  targetPositions: [0, 0, 0, 0, 0],
  winAmount: 0,
  
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
    const { targetPositions, symbols, reelStrips, bet } = get();
    
    // Get the symbol ID at the target position for each reel
    const resultSymbolIds = targetPositions.map((pos, reelIndex) => {
        // The 'pos' is the index on the strip (0-49)
        const strip = reelStrips[reelIndex];
        return strip[pos % strip.length];
    });

    // Check for matches (simple line check)
    const firstId = resultSymbolIds[0];
    let matchCount = 1;
    for (let i = 1; i < resultSymbolIds.length; i++) {
        if (resultSymbolIds[i] === firstId) matchCount++;
        else break;
    }

    let win = 0;
    if (matchCount >= 3) {
      const symbolConfig = symbols.find(s => s.id === firstId);
      if (symbolConfig) {
          win = bet * symbolConfig.multiplier * (matchCount - 2);
      }
    }

    set((state) => ({ 
      status: win > 0 ? 'win' : 'idle',
      winAmount: win,
      balance: state.balance + win,
      reels: targetPositions // Ensure state is synced
    }));
  }
}));

