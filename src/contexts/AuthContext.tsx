
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  error: null,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Mock user data for development purposes
const MOCK_USERS: User[] = [
  {
    id: "1",
    firstName: "Admin",
    lastName: "User",
    email: "admin@university.edu",
    role: "admin" as UserRole,
    profileImage: "https://ui-avatars.com/api/?name=Admin+User&background=random",
  },
  {
    id: "2",
    firstName: "Department",
    lastName: "Head",
    email: "head@university.edu",
    role: "departmentHead" as UserRole,
    department: "Computer Science",
    profileImage: "https://ui-avatars.com/api/?name=Department+Head&background=random",
  },
  {
    id: "3",
    firstName: "Teacher",
    lastName: "User",
    email: "teacher@university.edu",
    role: "teacher" as UserRole,
    department: "Computer Science",
    profileImage: "https://ui-avatars.com/api/?name=Teacher+User&background=random",
  },
  {
    id: "4",
    firstName: "Student",
    lastName: "User",
    email: "student@university.edu",
    role: "student" as UserRole,
    department: "Computer Science",
    profileImage: "https://ui-avatars.com/api/?name=Student+User&background=random",
  },
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // This would normally be an API call to your backend
      // For now, we'll just simulate with mock users
      const foundUser = MOCK_USERS.find(u => u.email === email);
      
      if (foundUser && password === "password") { // simple mock password check
        setUser(foundUser);
        localStorage.setItem("user", JSON.stringify(foundUser));
      } else {
        throw new Error("Invalid email or password");
      }
    } catch (err) {
      setError((err as Error).message);
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
