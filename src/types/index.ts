export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'student' | 'admin';
  isApproved: boolean;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface CodeExplanation {
  line: number;
  code: string;
  explanation: string;
  memoryInfo?: {
    address?: string;
    value?: string;
    binary?: string;
    type?: string;
  };
}

export interface ExecutionResult {
  executionId: string;
  executionTime: number;
  language: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  error?: string;
}

export interface PendingUser {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}