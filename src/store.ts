import { create } from 'zustand';

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
    const { targetPositions, symbols, bet } = get();
    
    // Simple Win Evaluation: Check if all reels have the same symbol type
    // We need to map the target index (0-11) to the actual symbol type
    // For now, let's assume the strip is just 0,1,2,3,4,5,0,1,2,3,4,5...
    
    const getSymbolIndex = (pos: number) => pos % symbols.length;
    
    const symbolIndices = targetPositions.map(getSymbolIndex);
    
    // Check for matches
    // Logic: Count occurrences. If 3+ match, pay out.
    // Or just check line match (all 5 match, or first 3 match)
    
    const first = symbolIndices[0];
    let matchCount = 1;
    for (let i = 1; i < symbolIndices.length; i++) {
      if (symbolIndices[i] === first) matchCount++;
      else break; // Consecutive from left
    }

    let win = 0;
    if (matchCount >= 3) {
      const symbol = symbols[first];
      win = bet * symbol.multiplier * (matchCount - 2); // Simple formula
    }

    set((state) => ({ 
      status: win > 0 ? 'win' : 'idle',
      winAmount: win,
      balance: state.balance + win,
      reels: targetPositions // Ensure state is synced
    }));
  }
}));

