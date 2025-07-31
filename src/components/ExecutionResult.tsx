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
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center gap-2 text-blue-400">
          <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          <span>Executing code...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
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
      className="bg-slate-800 rounded-lg border border-slate-700"
    >
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSuccess ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )}
            <span className="font-medium text-white">
              {isSuccess ? 'Execution Successful' : 'Execution Failed'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{result.executionTime}ms</span>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {result.stdout && (
          <div>
            <h4 className="text-sm font-medium text-green-400 mb-2">Output:</h4>
            <pre className="bg-slate-900 p-3 rounded-lg text-green-300 text-sm font-mono overflow-x-auto">
              {result.stdout}
            </pre>
          </div>
        )}
        
        {result.stderr && (
          <div>
            <h4 className="text-sm font-medium text-red-400 mb-2">Errors:</h4>
            <pre className="bg-slate-900 p-3 rounded-lg text-red-300 text-sm font-mono overflow-x-auto">
              {result.stderr}
            </pre>
          </div>
        )}
        
        {result.error && (
          <div>
            <h4 className="text-sm font-medium text-red-400 mb-2">System Error:</h4>
            <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg text-red-300 text-sm">
              {result.error}
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-400">
          Exit Code: {result.exitCode} | Execution ID: {result.executionId}
        </div>
      </div>
    </motion.div>
  );
};