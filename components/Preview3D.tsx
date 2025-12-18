'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useTexture, Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { X, Box, Circle, CarFront } from 'lucide-react';

interface Preview3DProps {
  textureUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

// Internal component to handle texture loading and material application
const PreviewModel = ({ textureUrl, shape }: { textureUrl: string, shape: 'car' | 'sphere' | 'box' }) => {
  const texture = useTexture(textureUrl);
  
  // Configure texture to look good
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // texture.repeat.set(1, 1);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Simple material with the wrap texture
  // We use standard material to react to light
  const material = new THREE.MeshStandardMaterial({ 
    map: texture,
    roughness: 0.3,
    metalness: 0.1,
    envMapIntensity: 1,
  });

  if (shape === 'sphere') {
      return (
          <mesh material={material}>
              <sphereGeometry args={[1.5, 64, 64]} />
          </mesh>
      );
  }
  
  if (shape === 'box') {
      return (
          <RoundedBox args={[2, 2, 2]} radius={0.1} smoothness={4} material={material}>
             <meshStandardMaterial map={texture} />
          </RoundedBox>
      );
  }

  // "Car" shape (Simplified as a sleek capsule/box hybrid)
  return (
    <group>
        {/* Car Body */}
        <RoundedBox args={[4.5, 1.2, 2]} radius={0.4} smoothness={8} position={[0, 0.6, 0]} material={material}>
        </RoundedBox>
        
        {/* Wheels (Visual only, black) */}
        <mesh position={[-1.5, 0.35, 1]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
            <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[1.5, 0.35, 1]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
            <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[-1.5, 0.35, -1]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
            <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[1.5, 0.35, -1]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
            <meshStandardMaterial color="#111" />
        </mesh>
    </group>
  );
};

export default function Preview3D({ textureUrl, isOpen, onClose }: Preview3DProps) {
  const [shape, setShape] = useState<'car' | 'sphere' | 'box'>('car');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl h-[80vh] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
                <CarFront className="text-blue-500" /> 3D Preview
            </h2>
            <button 
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/50 p-2 rounded-full backdrop-blur-md border border-white/10">
            <button 
                onClick={() => setShape('car')}
                className={`p-3 rounded-full transition-all ${shape === 'car' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                title="Car View"
            >
                <CarFront size={20} />
            </button>
            <button 
                onClick={() => setShape('sphere')}
                className={`p-3 rounded-full transition-all ${shape === 'sphere' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                title="Sphere View"
            >
                <Circle size={20} />
            </button>
            <button 
                onClick={() => setShape('box')}
                className={`p-3 rounded-full transition-all ${shape === 'box' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                title="Cube View"
            >
                <Box size={20} />
            </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 50 }}>
                <Suspense fallback={<Html center><div className="text-white font-mono">Loading Texture...</div></Html>}>
                    <Stage environment="city" intensity={0.6} adjustCamera={false}>
                        <PreviewModel textureUrl={textureUrl} shape={shape} />
                    </Stage>
                    <OrbitControls autoRotate autoRotateSpeed={0.5} makeDefault />
                </Suspense>
            </Canvas>
        </div>
        
        <div className="absolute bottom-4 right-4 text-white/30 text-xs pointer-events-none">
            * Generic 3D model for visualization
        </div>
      </div>
    </div>
  );
}
