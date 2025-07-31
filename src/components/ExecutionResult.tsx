import React from 'react';
import { ExecutionResult as ExecutionResultType } from '../types';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Terminal } from 'lucide-react';

interface ExecutionResultProps {
  result: ExecutionResultType | null;
  loading: boolean;
}

export const ExecutionResult: React.FC<ExecutionResultProps> = ({ result, loading }) => {
  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-blue-400">
          <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          <span>Executing code...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Click "Run Code" to execute</p>
        </div>
      </div>
    );
  }

  const isSuccess = result.exitCode === 0 && !result.error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col"
    >
      <div className="p-4 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-blue-400" />
            <span className="font-medium text-white">Output</span>
            {isSuccess ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{result.executionTime}ms</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {result.stdout && (
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">Program Output:</h4>
              <pre className="bg-slate-900 p-3 rounded-lg text-green-300 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {result.stdout}
              </pre>
            </div>
          )}
          
          {result.stderr && (
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-2">Errors/Warnings:</h4>
              <pre className="bg-slate-900 p-3 rounded-lg text-red-300 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {result.stderr}
              </pre>
            </div>
          )}
          
          {result.error && (
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-2">Execution Error:</h4>
              <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg text-red-300 text-sm">
                {result.error}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Exit Code: {result.exitCode}</span>
            <span>Language: {result.language}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};