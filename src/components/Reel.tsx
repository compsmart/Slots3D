import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';

interface ReelProps {
  index: number;
  textures: Record<string, THREE.Texture>;
  position: [number, number, number];
}

export const Reel = ({ index, textures, position }: ReelProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const { 
    symbols, 
    symbolsPerReel, 
    reelStrips,
    status, 
    targetPositions, 
    completeSpin 
  } = useGameStore();

  // Animation state
  const animationState = useRef({
    isSpinning: false,
    hasSpun: false,
    currentVelocity: 0,
    targetRotation: 0,
    currentRotation: 0,
    startTime: 0,
    stopDelay: index * 0.5, // Sequential stopping
    spinDuration: 3 + index * 0.5, // Minimum spin time
    startRotation: 0,
    startRotationCaptured: false
  });

  const anglePerSymbol = (Math.PI * 2) / symbolsPerReel;
  
  // Calculate Radius based on desired panel height (to keep aspect ratio)
  const DESIRED_PANEL_HEIGHT = 1.5; // Matches the plane geometry height
  const radius = DESIRED_PANEL_HEIGHT / (2 * Math.tan(Math.PI / symbolsPerReel));

  // Calculate precise panel height (should match DESIRED_PANEL_HEIGHT closely)
  const panelHeight = 2 * radius * Math.tan(Math.PI / symbolsPerReel);

  // Build the reel geometry
  // We place panels in a circle
  const panels = useMemo(() => {
    const items = [];
    const strip = reelStrips[index]; // Get the symbol strip for this reel

    for (let i = 0; i < symbolsPerReel; i++) {
      // Determine which symbol is at this index
      const symbolId = strip ? strip[i % strip.length] : symbols[0].id;
      const symbol = symbols.find(s => s.id === symbolId) || symbols[0];
      
      const angle = i * anglePerSymbol;
      // Position on circumference
      // x = r * sin(theta), z = r * cos(theta)
      // We rotate the panels to face outward
      
      items.push({
        index: i,
        symbol,
        angle,
        position: [
          0, 
          Math.sin(angle) * radius, 
          Math.cos(angle) * radius
        ] as [number, number, number],
        rotation: [-angle, 0, 0] as [number, number, number] // Correctly face outward radially
      });
    }
    return items;
  }, [symbols, symbolsPerReel, radius, anglePerSymbol, reelStrips, index]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const anim = animationState.current;

    // Reset flag when not spinning
    if (status !== 'spinning') {
        anim.hasSpun = false;
    }

    // Start spinning
    if (status === 'spinning' && !anim.isSpinning && !anim.hasSpun) {
      anim.isSpinning = true;
      anim.hasSpun = true;
      anim.startTime = state.clock.elapsedTime;
      anim.currentVelocity = 0;
      // Calculate target rotation
      // We want to land on targetPositions[index]
      // Current rotation is anim.currentRotation
      // We want to add at least N full rotations
      
      const targetIndex = targetPositions[index];
      
      // We need to find the next multiple of 2PI + targetAngle that is > currentRotation
      // And adds some minimum spins
      const minSpins = 5; // Full rotations
      const currentRot = anim.currentRotation;
      
      // Normalize current rotation to be positive for easier calc (optional)
      // Actually, we just keep adding.
      
      // Calculate where the specific symbol is.
      // If we rotate the Group by X, the symbol at angle A ends up at A + X.
      // We want symbol `targetIndex` to be at angle 0 (facing camera) or PI/2?
      // Let's assume camera looks at Z=radius, Y=0.
      // The item at angle 0 is at Y=0, Z=radius (if sin/cos mapped correctly).
      // Wait:
      // y = sin(angle) * r, z = cos(angle) * r
      // Angle 0: y=0, z=r. This faces the camera if camera is at +Z.
      // So we want the target symbol to be at Angle 0.
      // If symbol is at 'angle' in local space, we need GroupRotation + angle = N * 2PI.
      // => GroupRotation = -angle + N * 2PI.
      
      const symbolAngle = targetIndex * anglePerSymbol;
      const nextMultiple = Math.ceil(currentRot / (Math.PI * 2)) * (Math.PI * 2);
      
      // Add minimum distance
      // To land symbol 'targetIndex' at the front (angle 0), we need to rotate the group 
      // such that 'symbolAngle' becomes 0.
      // Since positive rotation moves symbols from Top (positive angle) to Front (0),
      // we need to rotate BY 'symbolAngle'.
      // targetRotation = k * 360 + symbolAngle.
      let target = nextMultiple + (minSpins * Math.PI * 2) + symbolAngle;
      
      // Ensure we are always moving forward
      if (target < currentRot + (minSpins * Math.PI * 2)) {
         target += Math.PI * 2;
      }

      anim.targetRotation = target;
    }

    if (anim.isSpinning) {
      const elapsed = state.clock.elapsedTime - anim.startTime;
      const totalDuration = anim.spinDuration;

      if (elapsed < totalDuration) {
        // Accelerate / Constant Speed
        // Simple Easing: easeInOutCubic? Or just easeOut for the stop.
        // Let's simple Lerp for now or custom physics-ish
        
        // We can just interpolate from StartRotation to TargetRotation
        // over TotalDuration using an easing function.
        // But we need to capture StartRotation when spin starts.
        // Let's assume we did that (we didn't store it yet).
        
        // Re-implementation with simple Easing
        // We need `startRotation` stored once at trigger
        // Let's do a lazy init logic here
        if (!anim.startRotationCaptured) {
           anim.startRotation = anim.currentRotation;
           anim.startRotationCaptured = true;
        }
        
        const t = Math.min(1, elapsed / totalDuration);
        // Ease out cubic: 1 - pow(1 - x, 3)
        const ease = 1 - Math.pow(1 - t, 3);
        
        anim.currentRotation = anim.startRotation + (anim.targetRotation - anim.startRotation) * ease;
        
      } else {
        // Finished
        anim.currentRotation = anim.targetRotation;
        anim.isSpinning = false;
        anim.startRotationCaptured = false;
        
        // Notify store only once (last reel)
        if (index === 4) {
            completeSpin();
        }
      }

      groupRef.current.rotation.x = anim.currentRotation;
    }
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        {panels.map((panel) => (
          <group 
            key={panel.index} 
            position={panel.position} 
            rotation={panel.rotation}
          >
            {/* Panel Background */}
            <mesh>
              <planeGeometry args={[2, panelHeight]} /> {/* Width, Height of segment */}
              <meshStandardMaterial color="#f0f0f0" />
            </mesh>
            {/* Symbol */}
            <mesh position={[0, 0, 0.01]}>
               <planeGeometry args={[1.8, panelHeight * 0.8]} />
               <meshStandardMaterial 
                 map={textures[panel.symbol.id]} 
                 transparent 
                 alphaTest={0.5}
               />
            </mesh>
            {/* Debug Text (optional, sticking to graphic) */}
          </group>
        ))}
      </group>
    </group>
  );
};

