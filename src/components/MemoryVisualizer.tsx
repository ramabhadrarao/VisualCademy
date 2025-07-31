import React from 'react';
import { CodeExplanation } from '../types';
import { motion } from 'framer-motion';

interface MemoryVisualizerProps {
  explanations: CodeExplanation[];
}

interface MemoryBlock {
  name: string;
  type: string;
  address: string;
  value: string;
  binary: string;
  size: number;
  line: number;
}

export const MemoryVisualizer: React.FC<MemoryVisualizerProps> = ({ explanations }) => {
  const memoryBlocks = explanations
    .filter(exp => exp.memoryInfo)
    .map(exp => {
      const nameMatch = exp.code.match(/(?:int|float|double|char|long|short|unsigned)\s*\*?\s*(\w+)/) ||
                        exp.code.match(/(\w+)\s*=/);
      const name = nameMatch ? nameMatch[1] : 'unknown';
      
      return {
        name,
        type: exp.memoryInfo!.type || 'unknown',
        address: exp.memoryInfo!.address,
        value: exp.memoryInfo!.value,
        binary: exp.memoryInfo!.binary,
        size: getTypeSize(exp.memoryInfo!.type || ''),
        line: exp.line
      };
    });

  function getTypeSize(type: string): number {
    if (type.includes('double') || type.includes('long')) return 8;
    if (type.includes('int') || type.includes('float')) return 4;
    if (type.includes('short')) return 2;
    if (type.includes('char')) return 1;
    if (type.includes('[')) {
      const match = type.match(/\[(\d+)\]/);
      if (match) {
        const size = parseInt(match[1]);
        const baseType = type.split('[')[0];
        return size * getTypeSize(baseType);
      }
    }
    return 4;
  }

  function renderBits(binary: string, type: string): JSX.Element[] {
    const bits = binary.replace(/\s/g, '').split('');
    const bitElements: JSX.Element[] = [];
    
    // Group bits by bytes (8 bits)
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.slice(i, i + 8);
      bitElements.push(
        <div key={i} className="flex gap-px">
          {byte.map((bit, idx) => (
            <div
              key={`${i}-${idx}`}
              className={`w-6 h-8 flex items-center justify-center text-xs font-mono border ${
                bit === '1' 
                  ? 'bg-green-900 border-green-600 text-green-300' 
                  : 'bg-slate-900 border-slate-600 text-slate-400'
              }`}
            >
              {bit}
            </div>
          ))}
        </div>
      );
    }
    
    return bitElements;
  }

  function renderMemoryBlock(block: MemoryBlock, index: number): JSX.Element {
    const isPointer = block.type.includes('*');
    const isArray = block.type.includes('[');
    const bitsArray = renderBits(block.binary, block.type);

    return (
      <motion.div
        key={`${block.name}-${block.line}-${index}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className="mb-6"
      >
        {/* Variable Name Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="text-lg font-bold text-white">{block.name}</div>
          <div className="text-sm px-2 py-1 bg-purple-600 rounded text-white">
            {block.type}
          </div>
          <div className="text-sm text-gray-400">
            {block.size * 8} bits ({block.size} bytes)
          </div>
        </div>

        {/* Memory Visualization Container */}
        <div className="bg-slate-900 rounded-lg p-4 border-2 border-slate-700">
          {/* Address Bar */}
          <div className="mb-3 pb-3 border-b border-slate-700">
            <div className="text-xs text-gray-400 mb-1">Memory Address</div>
            <div className="font-mono text-green-400 text-sm bg-slate-800 px-3 py-2 rounded">
              {block.address}
            </div>
          </div>

          {/* Value Display */}
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1">Stored Value</div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="text-2xl font-mono text-yellow-400 text-center">
                {block.value}
              </div>
            </div>
          </div>

          {/* Bit-level Visualization */}
          <div>
            <div className="text-xs text-gray-400 mb-2">Binary Representation (MSB → LSB)</div>
            <div className="bg-black rounded-lg p-3 border border-slate-600 overflow-x-auto">
              <div className="flex gap-2 min-w-fit">
                {bitsArray}
              </div>
              
              {/* Byte indices */}
              <div className="flex gap-2 mt-2">
                {Array.from({ length: block.size }, (_, i) => (
                  <div key={i} className="w-[50px] text-center text-xs text-gray-500">
                    Byte {block.size - i - 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Special Type Indicators */}
          {isArray && (
            <div className="mt-3 p-3 bg-purple-900/20 rounded border border-purple-700">
              <div className="text-sm text-purple-300">
                📊 Array: Contiguous memory allocation
              </div>
            </div>
          )}
          
          {isPointer && (
            <div className="mt-3 p-3 bg-cyan-900/20 rounded border border-cyan-700">
              <div className="text-sm text-cyan-300">
                👉 Pointer: Stores memory address of another variable
              </div>
            </div>
          )}

          {/* Type-specific Information */}
          {block.type.includes('float') || block.type.includes('double') ? (
            <div className="mt-3 p-3 bg-blue-900/20 rounded border border-blue-700">
              <div className="text-xs text-blue-300">
                <div>IEEE 754 Floating Point Format</div>
                <div className="mt-1 font-mono text-xs">
                  {block.type === 'float' 
                    ? '1 sign bit | 8 exponent bits | 23 mantissa bits'
                    : '1 sign bit | 11 exponent bits | 52 mantissa bits'}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    );
  }

  if (memoryBlocks.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">💾</div>
          <p className="text-lg">No variables in memory yet</p>
          <p className="text-sm mt-2">Declare variables to see memory visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col">
      <div className="p-4 border-b border-slate-700 flex-shrink-0">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">💾</span>
          Advanced Memory Visualization
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Real-time bit-level memory representation
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {memoryBlocks.map((block, index) => renderMemoryBlock(block, index))}
        </div>
        
        {/* Memory Map Summary */}
        <div className="mt-8 p-4 bg-slate-900 rounded-lg border border-slate-700">
          <h4 className="text-sm font-bold text-white mb-3">Memory Map Summary</h4>
          
          <div className="space-y-2">
            {memoryBlocks.map((block, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="font-mono text-green-400 w-24">{block.address}</div>
                <div className="flex-1 bg-slate-700 h-6 rounded relative overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${(block.size / 8) * 100}%` }}
                  >
                    {block.name}
                  </div>
                </div>
                <div className="text-gray-400 w-16 text-right">{block.size}B</div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Total Variables: {memoryBlocks.length}</span>
              <span>Total Memory: {memoryBlocks.reduce((sum, b) => sum + b.size, 0)} bytes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};