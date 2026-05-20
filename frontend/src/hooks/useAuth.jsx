import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const PERSONAL_USERS = ['Edu', 'Nicole'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => localStorage.getItem('activeUser'));

  const getToken = useCallback(() => {
    const username = localStorage.getItem('activeUser');
    if (!username) return null;
    return localStorage.getItem(`token_${username}`);
  }, []);

  const login = useCallback((username, token) => {
    localStorage.setItem(`token_${username}`, token);
    localStorage.setItem('token', token);
    localStorage.setItem('activeUser', username);
    setUser(username);
  }, []);

  const logout = useCallback(() => {
    const username = localStorage.getItem('activeUser');
    if (username) localStorage.removeItem(`token_${username}`);
    localStorage.removeItem('token');
    localStorage.removeItem('activeUser');
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(user && localStorage.getItem(`token_${user}`));
  const canAccessPersonal = PERSONAL_USERS.includes(user);

  return (
    <AuthContext.Provider value={{ user, getToken, login, logout, isAuthenticated, canAccessPersonal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
