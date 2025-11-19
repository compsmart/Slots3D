import { useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Reel } from './Reel';
import { useGameStore } from '../store';
import { createSymbolTexture } from '../utils/textureGenerator';
import logoUrl from '../assets/logo.avif';

const SlotMachineScene = () => {
  const { symbols, reelCount, symbolsPerReel, isBonusActive, status } = useGameStore();
  const logoTexture = useTexture(logoUrl);
  
  const [flash, setFlash] = useState(false);
  
  useEffect(() => {
      if (status === 'win') {
          const interval = setInterval(() => {
              setFlash(prev => !prev);
          }, 250);
          return () => clearInterval(interval);
      } else {
          setFlash(false);
      }
  }, [status, isBonusActive]);

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
  const DESIRED_PANEL_HEIGHT = 1.2;
  const radius = DESIRED_PANEL_HEIGHT / (1.7 * Math.tan(Math.PI / symbolsPerReel));
  const diameter = radius * 2;
  
  // Payline Dimensions
  const paylineWidth = (reelCount * reelSpacing); // Slightly wider than just center-to-center
  const totalReelWidth = reelCount * reelSpacing;

  const anglePerSymbol = (Math.PI * 2) / symbolsPerReel;

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
            <boxGeometry args={[totalReelWidth + 2, diameter + 0.5, 1]} />
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
            <meshBasicMaterial color={status === 'win' && flash ? "#00ff00" : "red"} />
        </mesh>

        {/* Bonus Lines (Full Cage of Lines) */}
        {isBonusActive && Array.from({ length: symbolsPerReel }).map((_, i) => {
            const angle = i * anglePerSymbol;
            
            // Skip drawing the bonus line exactly at angle 0 if we want to keep the red one distinctive
            // Or just draw it over/under. Angle 0 is index 0 usually.
            if (i === 0) return null;

            // Calculate position on circumference
            // The line should be parallel to the reel panels
            const y = Math.sin(angle) * (radius + 0.1);
            const z = Math.cos(angle) * (radius + 0.1);
            
            // If bonus is active, all lines are winners, so flash them all
            // Base color blue, flash green
            const color = status === 'win' && flash ? "#00ff00" : "#0088ff"; // Blue

            return (
                <mesh 
                    key={i} 
                    position={[0, y, z]} 
                    rotation={[-angle, 0, 0]}
                >
                    <boxGeometry args={[paylineWidth, 0.05, 0.05]} />
                    <meshBasicMaterial color={color} />
                </mesh>
            );
        })}
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

