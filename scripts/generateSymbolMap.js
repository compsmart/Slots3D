import * as fs from 'fs';
import * as path from 'path';

// Reduced symbol set for higher win frequency
const SYMBOLS = ['cherry', 'seven', 'diamond']; 
const REEL_COUNT = 5;
const SYMBOLS_PER_REEL = 50;
const BONUS_PER_REEL = 5;

const generateMap = () => {
  const reels = [];

  for (let r = 0; r < REEL_COUNT; r++) {
    const reel = [];
    // Add Bonus Symbols first
    for (let b = 0; b < BONUS_PER_REEL; b++) {
        reel.push('bonus');
    }
    
    // Fill rest with random
    for (let s = BONUS_PER_REEL; s < SYMBOLS_PER_REEL; s++) {
      const randomSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      reel.push(randomSymbol);
    }
    
    // Shuffle the reel to distribute bonuses
    for (let i = reel.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [reel[i], reel[j]] = [reel[j], reel[i]];
    }
    
    reels.push(reel);
  }

  return {
    reels
  };
};

const mapData = generateMap();
const outputPath = path.resolve('src', 'symbolMap.json');

fs.writeFileSync(outputPath, JSON.stringify(mapData, null, 2));

console.log(`Generated symbol map at ${outputPath}`);
console.log(`Reels: ${REEL_COUNT}, Symbols per reel: ${SYMBOLS_PER_REEL}`);

