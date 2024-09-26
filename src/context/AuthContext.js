import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usernamePasswordVerified, setUsernamePasswordVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/check-auth', { withCredentials: true });
      setIsAuthenticated(response.data.isAuthenticated);
      setUsernamePasswordVerified(response.data.usernamePasswordVerified);
    } catch (error) {
      setIsAuthenticated(false);
      setUsernamePasswordVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password, pin) => {
    try {
      const response = await axios.post('/api/signin', { username, password }, { withCredentials: true });
      setUsernamePasswordVerified(true);
      if (pin) {
        await axios.post('/api/validate-pin', { pin }, { withCredentials: true });
        setIsAuthenticated(true);
        router.push('/HomeAdmin');
      } else {
        router.push('/Pin');
      }
    } catch (error) {
      setUsernamePasswordVerified(false);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.get('/api/logout', { withCredentials: true });
      setIsAuthenticated(false);
      setUsernamePasswordVerified(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout, usernamePasswordVerified }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const withAuth = (WrappedComponent) => {
  return (props) => {
    const { isAuthenticated, loading, usernamePasswordVerified } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated && !usernamePasswordVerified) {
          router.replace('/');
        } else if (!isAuthenticated && usernamePasswordVerified && router.pathname !== '/Pin') {
          router.replace('/Pin');
        }
      }
    }, [loading, isAuthenticated, usernamePasswordVerified, router]);

    if (loading) {
      return <div>Loading...</div>;
    }

    return isAuthenticated || (usernamePasswordVerified && router.pathname === '/Pin') ? <WrappedComponent {...props} /> : null;
  };
};