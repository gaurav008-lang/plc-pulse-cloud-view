
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  email: string;
  name?: string;
  isAdmin: boolean;
  loginTime: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  
  useEffect(() => {
    // Check for existing auth on mount
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        
        // Check if login session is still valid (24 hours)
        const loginTime = new Date(parsedUser.loginTime).getTime();
        const currentTime = new Date().getTime();
        const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
        
        if (currentTime - loginTime < SESSION_DURATION) {
          setUser(parsedUser);
        } else {
          // Session expired
          localStorage.removeItem('authUser');
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem('authUser');
      }
    }
  }, []);
  
  const logout = () => {
    localStorage.removeItem('authUser');
    setUser(null);
  };
  
  const value = {
    user,
    isAuthenticated: user !== null,
    isAdmin: user?.isAdmin || false,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
