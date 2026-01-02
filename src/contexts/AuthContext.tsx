import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authService } from "@/lib/services";
import { User, UserRole } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Auth is handled by the server via authService

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    setLoading(true);
    try {
      const me = await authService.me();
      setUser(me || null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("eduhub_token")
          : null;
      if (token) {
        try {
          const me = await authService.me();
          setUser(me || null);
        } catch (err) {
          localStorage.removeItem("eduhub_token");
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data: any = await authService.login(email, password);
      if (data?.token) {
        localStorage.setItem("eduhub_token", data.token);
        setUser(data.user || null);
        return { error: null };
      }
      return { error: data };
    } catch (err) {
      return { error: err };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ) => {
    try {
      const data: any = await authService.register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
      });
      // If server issued a token (e.g., immediate activation), log user in.
      if (data?.token) {
        localStorage.setItem("eduhub_token", data.token);
        setUser(data.user || null);
        return { error: null };
      }

      // If server responded indicating pending confirmation, treat as success without login
      if (data?.message === "pending_confirmation") {
        return { error: null };
      }

      // Fallback: treat other responses without token as errors
      return { error: data };
    } catch (err) {
      return { error: err };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("eduhub_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
