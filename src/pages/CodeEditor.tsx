import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { CodeExplanationPanel } from '../components/CodeExplanationPanel';
import { MemoryVisualizer } from '../components/MemoryVisualizer';
import { ExecutionResult } from '../components/ExecutionResult';
import { AIChat } from '../components/AIChat';
import { ProgramManager } from '../components/ProgramManager';
import { TestRunner } from '../components/TestRunner';
import { useAuth } from '../contexts/AuthContext';
import { CCodeExplainer } from '../utils/codeExplainer';
import { CodeExplanation, ExecutionResult as ExecutionResultType } from '../types';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { 
  Play, Save, FileText, Cpu, MessageSquare, FolderOpen, 
  TestTube, BookOpen, Lightbulb, Bug, FileCode 
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const DEFAULT_CODE = `#include <stdio.h>

int main() {
    // Basic data types
    int x = 30;
    int y = 10;
    int z = x + y;
    
    // Unsigned types
    unsigned int counter = 255;
    
    // Different sizes
    short small_num = 32767;
    long big_num = 1234567890;
    
    // Floating point
    float pi = 3.14159;
    double precision = 3.141592653589793;
    
    // Character
    char grade = 'A';
    char initial = 'Z';
    
    // Arrays
    int numbers[5] = {10, 20, 30, 40, 50};
    char name[10] = "Hello";
    float scores[3] = {98.5, 87.3, 92.1};
    
    // Pointers
    int *ptr = &x;
    int **ptr_to_ptr = &ptr;
    
    // Array operations
    numbers[2] = 99;
    
    // Calculations
    z = x + y;
    counter = counter + 1;
    
    // Output
    printf("x = %d at address %p\\n", x, &x);
    printf("y = %d\\n", y);
    printf("z = x + y = %d\\n", z);
    printf("pi = %.2f\\n", pi);
    printf("grade = %c (ASCII: %d)\\n", grade, grade);
    printf("Array element: %d\\n", numbers[2]);
    printf("Pointer value: %d\\n", *ptr);
    
    return 0;
}`;

export const CodeEditor: React.FC = () => {
  const { user } = useAuth();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [explanations, setExplanations] = useState<CodeExplanation[]>([]);
  const [executionResult, setExecutionResult] = useState<ExecutionResultType | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'explanations' | 'memory' | 'ai' | 'tests'>('explanations');
  const [showProgramManager, setShowProgramManager] = useState(false);
  const [currentProgramId, setCurrentProgramId] = useState<string | null>(null);
  const [currentProgramTitle, setCurrentProgramTitle] = useState<string>('Untitled');
  
  const CODE_EXECUTION_API_URL = import.meta.env.VITE_CODE_EXECUTION_API_URL || 'http://43.250.40.133:3000';
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (code.trim()) {
      const newExplanations = CCodeExplainer.explainCode(code);
      setExplanations(newExplanations);
    } else {
      setExplanations([]);
    }
  }, [code]);

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code to execute');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const response = await axios.post(`${CODE_EXECUTION_API_URL}/api/v1/execute`, {
        code: code,
        language: 'c',
        timeout: 10000
      });

      setExecutionResult(response.data);
      
      // Update program statistics if loaded from saved program
      if (currentProgramId) {
        try {
          await axios.post(`${API_URL}/api/programs/${currentProgramId}/execute`);
        } catch (error) {
          console.error('Failed to update program statistics:', error);
        }
      }
      
      toast.success('Code executed successfully!');
    } catch (error: any) {
      const errorResult: ExecutionResultType = {
        executionId: 'error',
        executionTime: 0,
        language: 'c',
        stdout: '',
        stderr: '',
        exitCode: 1,
        error: error.response?.data?.message || error.message || 'Failed to execute code'
      };
      setExecutionResult(errorResult);
      toast.error('Code execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleLoadProgram = (program: any) => {
    setCode(program.code);
    setCurrentProgramId(program._id);
    setCurrentProgramTitle(program.title);
    setExecutionResult(null);
    toast.success(`Loaded: ${program.title}`);
  };

  const handleNewProgram = () => {
    setCode(DEFAULT_CODE);
    setCurrentProgramId(null);
    setCurrentProgramTitle('Untitled');
    setExecutionResult(null);
    toast.success('New program created');
  };

  const getAIInsights = async (type: 'improvements' | 'debug' | 'explain') => {
    if (!currentProgramId) {
      toast.error('Please save your program first');
      return;
    }

    try {
      let response;
      switch (type) {
        case 'improvements':
          response = await axios.post(`${API_URL}/api/programs/${currentProgramId}/ai/improvements`);
          toast.success('Got improvement suggestions!');
          break;
        case 'debug':
          if (executionResult?.stderr) {
            response = await axios.post(`${API_URL}/api/programs/${currentProgramId}/ai/debug`, {
              error: executionResult.stderr
            });
            toast.success('Debug suggestions ready!');
          } else {
            toast.error('No errors to debug');
            return;
          }
          break;
        case 'explain':
          response = await axios.post(`${API_URL}/api/programs/${currentProgramId}/ai/explain`);
          toast.success('Code explanation ready!');
          break;
      }
      
      // Show response in AI chat tab
      setActiveTab('ai');
    } catch (error) {
      toast.error('Failed to get AI insights');
    }
  };

  if (!user?.isApproved) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-white mb-2">Account Pending Approval</h2>
            <p className="text-gray-400">
              Your account is waiting for admin approval. Please check back later.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen p-4">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  C Code Visualizer
                  {currentProgramTitle && (
                    <span className="text-lg text-purple-400 ml-3">
                      - {currentProgramTitle}
                    </span>
                  )}
                </h1>
                <p className="text-gray-400">
                  Write C code and see real-time explanations with memory visualization
                </p>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleNewProgram}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
                  title="New Program"
                >
                  <FileCode className="h-4 w-4" />
                  New
                </button>
                <button
                  onClick={() => setShowProgramManager(true)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
                  title="Open Program Manager"
                >
                  <FolderOpen className="h-4 w-4" />
                  Open
                </button>
                {currentProgramId && (
                  <>
                    <button
                      onClick={() => getAIInsights('improvements')}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
                      title="Get AI Improvements"
                    >
                      <Lightbulb className="h-4 w-4" />
                      Improve
                    </button>
                    {executionResult?.stderr && (
                      <button
                        onClick={() => getAIInsights('debug')}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
                        title="Debug with AI"
                      >
                        <Bug className="h-4 w-4" />
                        Debug
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Editor Layout - Two equal columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 160px)' }}>
            {/* Left Column - Code Editor and Output */}
            <div className="flex flex-col gap-4 min-h-0">
              {/* Code Editor */}
              <div className="bg-slate-800 rounded-lg border border-slate-700 flex-1 flex flex-col min-h-0" style={{ height: '60%' }}>
                <div className="p-4 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                    Code Editor
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowProgramManager(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      onClick={handleRunCode}
                      disabled={isExecuting}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      {isExecuting ? 'Running...' : 'Run Code'}
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 min-h-0">
                  <Editor
                    height="100%"
                    defaultLanguage="c"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      readOnly: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>

              {/* Execution Result */}
              <div className="flex-1 overflow-y-auto" style={{ height: '40%' }}>
                <ExecutionResult result={executionResult} loading={isExecuting} />
              </div>
            </div>

            {/* Right Column - Tabbed Content */}
            <div className="flex flex-col min-h-0">
              {/* Tab Navigation */}
              <div className="flex mb-4 flex-shrink-0">
                <button
                  onClick={() => setActiveTab('explanations')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-l-lg font-medium transition-colors ${
                    activeTab === 'explanations'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Explanations
                </button>
                <button
                  onClick={() => setActiveTab('memory')}
                  className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                    activeTab === 'memory'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  <Cpu className="h-4 w-4" />
                  Memory
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                    activeTab === 'ai'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                  disabled={!currentProgramId}
                  title={!currentProgramId ? 'Save program first' : ''}
                >
                  <MessageSquare className="h-4 w-4" />
                  AI Chat
                </button>
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-r-lg font-medium transition-colors ${
                    activeTab === 'tests'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                  disabled={!currentProgramId}
                  title={!currentProgramId ? 'Save program first' : ''}
                >
                  <TestTube className="h-4 w-4" />
                  Tests
                </button>
              </div>

              {/* Tab Content - Full height */}
              <div className="flex-1 min-h-0">
                {activeTab === 'explanations' && (
                  <CodeExplanationPanel explanations={explanations} />
                )}
                {activeTab === 'memory' && (
                  <MemoryVisualizer explanations={explanations} />
                )}
                {activeTab === 'ai' && currentProgramId && (
                  <AIChat 
                    programId={currentProgramId} 
                    programCode={code}
                    onClose={() => setActiveTab('explanations')}
                  />
                )}
                {activeTab === 'tests' && currentProgramId && (
                  <TestRunner 
                    programId={currentProgramId}
                    programCode={code}
                  />
                )}
                {(activeTab === 'ai' || activeTab === 'tests') && !currentProgramId && (
                  <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex items-center justify-center">
                    <div className="text-center">
                      <Save className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg mb-2">Save your program first</p>
                      <p className="text-gray-500 text-sm">
                        Click the Save button to enable AI features and test cases
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Program Manager Modal */}
      {showProgramManager && (
        <ProgramManager
          currentCode={code}
          onLoadProgram={handleLoadProgram}
          onClose={() => setShowProgramManager(false)}
        />
      )}
    </Layout>
  );
};