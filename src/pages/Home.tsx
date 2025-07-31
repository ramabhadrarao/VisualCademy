import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Code, Brain, Eye, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Home: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Code,
      title: 'Interactive Code Editor',
      description: 'Write C code with syntax highlighting and real-time error detection'
    },
    {
      icon: Brain,
      title: 'Smart Explanations',
      description: 'Get line-by-line explanations of your code with detailed insights'
    },
    {
      icon: Eye,
      title: 'Memory Visualization',
      description: 'See how variables are stored in memory with binary representations'
    },
    {
      icon: Zap,
      title: 'Instant Execution',
      description: 'Run your code instantly and see results with detailed output'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Visual<span className="text-purple-400">Cademy</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Visualizing the logic beneath your code. Learn C programming with 
                interactive explanations and real-time memory visualization.
              </p>
              
              {user ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/editor"
                    className="inline-flex items-center px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-lg transition-colors"
                  >
                    Open Code Editor
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg text-lg transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-lg transition-colors"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg text-lg transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-black/20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Why Choose VisualCademy?
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Experience C programming like never before with our innovative visualization tools
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 * (index + 3) }}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-colors"
                >
                  <feature.icon className="h-12 w-12 text-purple-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Simple steps to start visualizing your C code
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Write Your Code
                </h3>
                <p className="text-gray-300">
                  Use our Monaco-powered editor to write C code with syntax highlighting
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Get Explanations
                </h3>
                <p className="text-gray-300">
                  See real-time explanations for each line with memory details
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Execute & Learn
                </h3>
                <p className="text-gray-300">
                  Run your code and see the output with detailed execution information
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!user && (
          <section className="py-20 px-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <h2 className="text-4xl font-bold text-white mb-6">
                  Ready to Start Learning?
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Join VisualCademy today and transform the way you learn C programming
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-lg transition-colors"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Create Free Account
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};