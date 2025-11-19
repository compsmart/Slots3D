import { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Reel } from './Reel';
import { useGameStore } from '../store';
import { createSymbolTexture } from '../utils/textureGenerator';
import logoUrl from '../assets/logo.avif';

const SlotMachineScene = () => {
  const { symbols, reelCount, symbolsPerReel } = useGameStore();
  const logoTexture = useTexture(logoUrl);

  // Generate textures once
  const textures = useMemo(() => {
    const map: Record<string, THREE.Texture> = {};
    symbols.forEach((sym) => {
      map[sym.id] = createSymbolTexture(sym.texture, sym.color);
    });
    return map;
  }, [symbols]);

  // Calculate positions
  const reelSpacing = 2.5;
  const totalWidth = (reelCount - 1) * reelSpacing;
  const startX = -totalWidth / 2;
  
  // Calculate Radius dynamically
  const DESIRED_PANEL_HEIGHT = 1;
  const radius = DESIRED_PANEL_HEIGHT / (2 * Math.tan(Math.PI / symbolsPerReel));
  const diameter = radius * 2;
  
  // Payline Dimensions
  const paylineWidth = (reelCount * reelSpacing); // Slightly wider than just center-to-center
  const totalReelWidth = reelCount * reelSpacing;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      {/* Environment Reflection */}
      <Environment preset="city" />

      <group position={[0, 0, 0]}>
        {/* Frame/Cabinet placeholder (Back Wall) */}
        <mesh position={[0, 0, -1]} receiveShadow>
            <boxGeometry args={[totalReelWidth + 2, diameter + 2, 1]} />
            <meshStandardMaterial color="#333" />
        </mesh>

        {/* Logo Sticker */}
        <mesh position={[0, 0, -0.49]}>
            <planeGeometry args={[8, 3]} />
            <meshStandardMaterial map={logoTexture} transparent />
        </mesh>
        
        {/* Reels */}
        {Array.from({ length: reelCount }).map((_, i) => (
          <Reel 
            key={i} 
            index={i} 
            textures={textures} 
            position={[startX + i * reelSpacing, 0, 0]} 
          />
        ))}
        
        {/* Payline Indicator (Center Line) */}
        {/* Positioned just in front of the reels (radius + offset) so it appears 'over' them */}
        <mesh position={[0, 0, radius + 0.1]}>
            <boxGeometry args={[paylineWidth, 0.05, 0.05]} />
            <meshBasicMaterial color="red" />
        </mesh>
      </group>
      
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
};

export const SlotMachine = () => {
  const { symbolsPerReel } = useGameStore();
  
  // Calculate approximate radius to position camera correctly
  const DESIRED_PANEL_HEIGHT = 1.5;
  const radius = DESIRED_PANEL_HEIGHT / (2 * Math.tan(Math.PI / symbolsPerReel));
  const cameraZ = radius + 15; // Distance from surface

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <Canvas camera={{ position: [0, 0, cameraZ], fov: 45 }}>
        <color attach="background" args={['#202020']} />
        <Suspense fallback={null}>
          <SlotMachineScene />
        </Suspense>
      </Canvas>
    </div>
  );
};

