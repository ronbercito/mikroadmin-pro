import { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, getToken } from '../api/client';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    api.me().then(setUser).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await api.login(email, password);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }
  function logout() { setToken(null); setUser(null); window.location.href = '/login'; }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthCtx.Provider>
  );
}