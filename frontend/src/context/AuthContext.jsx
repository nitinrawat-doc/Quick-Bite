import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiLogin, apiRegister, apiSetupAdmin, fetchCurrentUser } from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('qb_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Restore user session on mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const storedToken = localStorage.getItem('qb_token');
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          setToken(storedToken);
        }
      } catch (err) {
        // Token invalid or expired: clear
        localStorage.removeItem('qb_token');
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await apiLogin({ email, password });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('qb_token', newToken);
      setToken(newToken);
      setUser(newUser);
      toast.success(`Welcome back, ${newUser.name}! 👋`);
      return newUser;
    } catch (err) {
      toast.error(err.message || 'Login failed');
      throw err;
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const res = await apiRegister(userData);
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('qb_token', newToken);
      setToken(newToken);
      setUser(newUser);
      toast.success('Registration successful! Welcome to QuickBite 🎉');
      return newUser;
    } catch (err) {
      toast.error(err.message || 'Registration failed');
      throw err;
    }
  }, []);

  const registerAdmin = useCallback(async (adminData) => {
    try {
      const res = await apiSetupAdmin(adminData);
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('qb_token', newToken);
      setToken(newToken);
      setUser(newUser);
      toast.success('Admin authorization confirmed! Welcome to QuickBite Admin 🛡️');
      return newUser;
    } catch (err) {
      toast.error(err.message || 'Admin registration failed');
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('qb_token');
    localStorage.removeItem('qb_cart_items');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        registerAdmin,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
