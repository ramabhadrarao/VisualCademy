import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, FolderOpen, Plus, Search, Tag, Clock, Code, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Program {
  _id: string;
  title: string;
  description: string;
  code: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  statistics: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
  };
}

interface ProgramManagerProps {
  currentCode: string;
  onLoadProgram: (program: Program) => void;
  onClose: () => void;
}

export const ProgramManager: React.FC<ProgramManagerProps> = ({ 
  currentCode, 
  onLoadProgram, 
  onClose 
}) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  
  // Save dialog state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Set up axios interceptor for auth token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/programs/my-programs`);
      setPrograms(response.data.programs || []);
    } catch (error) {
      console.error('Failed to load programs:', error);
      toast.error('Failed to load programs');
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgram = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
      
      const response = await axios.post(`${API_URL}/api/programs/create`, {
        title,
        description,
        code: currentCode,
        tags: tagsArray
      });

      toast.success('Program saved successfully!');
      setPrograms([response.data.program, ...programs]);
      setShowSaveDialog(false);
      resetSaveDialog();
    } catch (error) {
      console.error('Failed to save program:', error);
      toast.error('Failed to save program');
    }
  };

  const deleteProgram = async (programId: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;

    try {
      await axios.delete(`${API_URL}/api/programs/${programId}`);
      setPrograms(programs.filter(p => p._id !== programId));
      toast.success('Program deleted');
    } catch (error) {
      console.error('Failed to delete program:', error);
      toast.error('Failed to delete program');
    }
  };

  const resetSaveDialog = () => {
    setTitle('');
    setDescription('');
    setTags('');
  };

  const filteredPrograms = programs ? programs.filter(program =>
    program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (program.tags && program.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  ) : [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-purple-400" />
              Program Manager
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Save Current Code
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading programs...</p>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-12">
              <Code className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No programs found</p>
              <p className="text-gray-500 text-sm">Save your first program to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrograms.map((program) => (
                <motion.div
                  key={program._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-800 rounded-lg p-4 border border-slate-700 cursor-pointer hover:border-purple-500 transition-all"
                  onClick={() => setSelectedProgram(program)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{program.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProgram(program._id);
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {program.description && (
                    <p className="text-gray-400 text-sm mb-3">{program.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(program.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Code className="h-3 w-3" />
                      {program.statistics.totalRuns} runs
                    </div>
                  </div>

                  {program.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {program.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Save Dialog */}
        <AnimatePresence>
          {showSaveDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-slate-800 rounded-lg p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-semibold text-white mb-4">Save Program</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="My C Program"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-20 resize-none"
                      placeholder="What does this program do?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="arrays, loops, pointers"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={saveProgram}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveDialog(false);
                      resetSaveDialog();
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Program Preview */}
        <AnimatePresence>
          {selectedProgram && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-slate-800 rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
              >
                <h3 className="text-xl font-semibold text-white mb-4">{selectedProgram.title}</h3>
                
                <div className="flex-1 overflow-y-auto mb-4">
                  <pre className="bg-slate-900 p-4 rounded-lg text-sm text-gray-300 font-mono overflow-x-auto">
                    {selectedProgram.code}
                  </pre>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      onLoadProgram(selectedProgram);
                      onClose();
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                  >
                    Load This Program
                  </button>
                  <button
                    onClick={() => setSelectedProgram(null)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};