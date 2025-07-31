import React from 'react';
import { CodeExplanation } from '../types';
import { motion } from 'framer-motion';

interface MemoryVisualizerProps {
  explanations: CodeExplanation[];
}

export const MemoryVisualizer: React.FC<MemoryVisualizerProps> = ({ explanations }) => {
  const memoryBlocks = explanations.filter(exp => exp.memoryInfo);

  if (memoryBlocks.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-3">Memory Layout</h3>
        <div className="text-gray-400 text-center py-8">
          No variables declared yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Memory Layout</h3>
      
      <div className="space-y-3">
        {memoryBlocks.map((block, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-700 rounded-lg p-3 border border-slate-600"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-300">
                Variable: <span className="text-blue-400 font-mono">{block.code.match(/(\w+)\s*=/)?.[1]}</span>
              </div>
              <div className="text-xs text-gray-400">
                {block.memoryInfo?.type?.toUpperCase()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Address:</span>
                <div className="font-mono text-green-400">{block.memoryInfo?.address}</div>
              </div>
              <div>
                <span className="text-gray-400">Value:</span>
                <div className="font-mono text-yellow-400">{block.memoryInfo?.value}</div>
              </div>
              <div className="col-span-1 sm:col-span-1">
                <span className="text-gray-400">Binary:</span>
                <div className="font-mono text-red-400 text-xs break-all">
                  {block.memoryInfo?.binary}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};