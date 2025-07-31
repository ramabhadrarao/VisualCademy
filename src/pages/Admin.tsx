import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { PendingUser } from '../types';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingUsers();
    }
  }, [user]);

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/pending-users');
      setPendingUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/approve-user/${userId}`);
      setPendingUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User approved successfully!');
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/reject-user/${userId}`);
      setPendingUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User rejected successfully!');
    } catch (error) {
      toast.error('Failed to reject user');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">
              Manage user registrations and system settings
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">
                  Pending User Approvals
                </h2>
                <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-sm">
                  {pendingUsers.length}
                </span>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                  <span className="ml-3 text-gray-400">Loading pending users...</span>
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium text-white mb-2">
                    All caught up!
                  </h3>
                  <p className="text-gray-400">
                    No pending user registrations at the moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((pendingUser, index) => (
                    <motion.div
                      key={pendingUser._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-700 rounded-lg p-4 border border-slate-600"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                            {pendingUser.username[0].toUpperCase()}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium text-white">
                              {pendingUser.username}
                            </h3>
                            <p className="text-gray-400">{pendingUser.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-400">
                                Registered {new Date(pendingUser.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveUser(pendingUser._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </button>
                          
                          <button
                            onClick={() => handleRejectUser(pendingUser._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};