import * as fs from 'fs';
import * as path from 'path';

const SYMBOLS = ['cherry', 'lemon', 'grape', 'bell', 'diamond', 'seven'];
const REEL_COUNT = 5;
const SYMBOLS_PER_REEL = 50;

const generateMap = () => {
  const reels = [];

  for (let r = 0; r < REEL_COUNT; r++) {
    const reel = [];
    for (let s = 0; s < SYMBOLS_PER_REEL; s++) {
      const randomSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      reel.push(randomSymbol);
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

