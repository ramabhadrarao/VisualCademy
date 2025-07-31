import React from 'react';
import { CodeExplanation } from '../types';
import { motion } from 'framer-motion';
import { Info, Cpu, Binary } from 'lucide-react';

interface CodeExplanationPanelProps {
  explanations: CodeExplanation[];
}

export const CodeExplanationPanel: React.FC<CodeExplanationPanelProps> = ({ explanations }) => {
  if (explanations.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Type some C code to see explanations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 h-full overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-400" />
          Code Explanations
        </h3>
      </div>
      
      <div className="p-4 space-y-4 h-full overflow-y-auto">
        {explanations.map((explanation, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-700 rounded-lg p-4 border border-slate-600"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {explanation.line}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <code className="bg-slate-900 text-green-400 px-2 py-1 rounded text-sm font-mono break-all">
                    {explanation.code}
                  </code>
                </div>
                
                <p className="text-gray-300 text-sm leading-relaxed">
                  {explanation.explanation}
                </p>
                
                {explanation.memoryInfo && (
                  <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-medium text-orange-400">Memory Details</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Address:</span>
                        <span className="font-mono text-green-400">{explanation.memoryInfo.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Value:</span>
                        <span className="font-mono text-yellow-400">{explanation.memoryInfo.value}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Binary className="h-3 w-3 text-red-400" />
                        <span className="font-mono text-red-400 text-xs break-all">
                          {explanation.memoryInfo.binary}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};