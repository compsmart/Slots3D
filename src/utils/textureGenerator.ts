import * as THREE from 'three';

export const createSymbolTexture = (text: string, color: string, width = 256, height = 256) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Border
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, width, height);

  // Text/Emoji
  ctx.font = `${width * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, width / 2, height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

