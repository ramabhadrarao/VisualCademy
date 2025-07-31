import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, CheckCircle, XCircle, Loader, FileText, Plus, Trash2, Sparkles } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
  passed?: boolean;
  actualOutput?: string;
  error?: string;
}

interface TestRunnerProps {
  programId: string;
  programCode: string;
}

export const TestRunner: React.FC<TestRunnerProps> = ({ programId, programCode }) => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddTest, setShowAddTest] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // New test case form
  const [newTest, setNewTest] = useState({
    input: '',
    expectedOutput: '',
    description: ''
  });

  // Set up axios interceptor for auth token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const generateTestCases = async () => {
    setIsGenerating(true);
    try {
      const response = await axios.post(`${API_URL}/api/programs/${programId}/ai/generate-tests`);
      setTestCases(response.data.testCases || []);
      toast.success('Test cases generated successfully!');
    } catch (error) {
      console.error('Failed to generate test cases:', error);
      toast.error('Failed to generate test cases. Make sure AI service is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  const runTests = async () => {
    if (testCases.length === 0) {
      toast.error('No test cases to run');
      return;
    }

    setIsRunning(true);
    try {
      const response = await axios.post(`${API_URL}/api/programs/${programId}/run-tests`);
      setTestCases(response.data.results || []);
      
      const passed = response.data.results.filter((t: TestCase) => t.passed).length;
      const total = response.data.results.length;
      
      if (passed === total) {
        toast.success(`All ${total} tests passed! 🎉`);
      } else {
        toast.error(`${passed}/${total} tests passed`);
      }
    } catch (error) {
      console.error('Failed to run tests:', error);
      toast.error('Failed to run tests');
    } finally {
      setIsRunning(false);
    }
  };

  const addTestCase = () => {
    if (!newTest.input || !newTest.expectedOutput) {
      toast.error('Please fill in all required fields');
      return;
    }

    setTestCases([...testCases, { ...newTest }]);
    setNewTest({ input: '', expectedOutput: '', description: '' });
    setShowAddTest(false);
    toast.success('Test case added');
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Test Cases
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddTest(true)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Test
            </button>
            <button
              onClick={generateTestCases}
              disabled={isGenerating}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white text-sm rounded-lg flex items-center gap-1 transition-colors"
            >
              {isGenerating ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate Tests
            </button>
            <button
              onClick={runTests}
              disabled={isRunning || testCases.length === 0}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white text-sm rounded-lg flex items-center gap-1 transition-colors"
            >
              {isRunning ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              Run All
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {testCases.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No test cases yet</p>
            <p className="text-sm text-gray-500">
              Add test cases manually or use AI to generate them
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {testCases.map((testCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-700 rounded-lg p-4 border ${
                  testCase.passed === undefined
                    ? 'border-slate-600'
                    : testCase.passed
                    ? 'border-green-600'
                    : 'border-red-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {testCase.passed !== undefined && (
                      testCase.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )
                    )}
                    <span className="font-medium text-white">Test #{index + 1}</span>
                  </div>
                  <button
                    onClick={() => removeTestCase(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {testCase.description && (
                  <p className="text-sm text-gray-300 mb-2">{testCase.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-gray-400">Input:</label>
                    <pre className="bg-slate-900 p-2 rounded mt-1 text-gray-300 font-mono overflow-x-auto">
                      {testCase.input || '(no input)'}
                    </pre>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Expected Output:</label>
                    <pre className="bg-slate-900 p-2 rounded mt-1 text-gray-300 font-mono overflow-x-auto">
                      {testCase.expectedOutput}
                    </pre>
                  </div>
                </div>

                {testCase.actualOutput !== undefined && (
                  <div className="mt-3">
                    <label className="text-xs text-gray-400">Actual Output:</label>
                    <pre className={`p-2 rounded mt-1 font-mono text-sm overflow-x-auto ${
                      testCase.passed 
                        ? 'bg-green-900/20 text-green-300' 
                        : 'bg-red-900/20 text-red-300'
                    }`}>
                      {testCase.actualOutput || '(no output)'}
                    </pre>
                  </div>
                )}

                {testCase.error && (
                  <div className="mt-3">
                    <label className="text-xs text-gray-400">Error:</label>
                    <pre className="bg-red-900/20 text-red-300 p-2 rounded mt-1 text-sm">
                      {testCase.error}
                    </pre>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Test Dialog */}
      {showAddTest && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Add Test Case</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Test case description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Input *
                </label>
                <textarea
                  value={newTest.input}
                  onChange={(e) => setNewTest({ ...newTest, input: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 font-mono text-sm resize-none"
                  placeholder="5&#10;10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Expected Output *
                </label>
                <textarea
                  value={newTest.expectedOutput}
                  onChange={(e) => setNewTest({ ...newTest, expectedOutput: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 font-mono text-sm resize-none"
                  placeholder="Sum: 15"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addTestCase}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
              >
                Add Test Case
              </button>
              <button
                onClick={() => {
                  setShowAddTest(false);
                  setNewTest({ input: '', expectedOutput: '', description: '' });
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};