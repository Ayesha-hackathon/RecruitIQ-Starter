import { createContext, useContext, useEffect, useState } from "react";
import { getSession, logout, type ReplitUser } from "@/lib/auth";

interface AuthContextValue {
  user: ReplitUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ReplitUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signOut = async () => {
    await logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
