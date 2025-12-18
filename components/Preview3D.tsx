'use client';

import React from 'react';
import { X, CarFront, Construction } from 'lucide-react';

interface Preview3DProps {
  textureUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Preview3D({ textureUrl, isOpen, onClose }: Preview3DProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col p-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900">
                <CarFront className="text-blue-600" size={28} /> 
                3D Preview
            </h2>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        {/* Development Content */}
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                <Construction className="text-blue-600" size={40} />
            </div>
            
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">Feature Under Development</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    We are currently working on integrating high-fidelity 3D models for all vehicle variants. This feature will be available soon!
                </p>
            </div>

            {/* Texture Preview Fallback */}
            <div className="w-full max-w-md mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-left">
                    Your Generated Texture Map
                </p>
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                    <img 
                        src={textureUrl} 
                        alt="Texture Preview" 
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
            >
                Close
            </button>
        </div>

      </div>
    </div>
  );
}
