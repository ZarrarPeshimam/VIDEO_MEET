import React, { createContext, useState, ReactNode } from 'react';

// Define types for user and context
type User = {
  id?: string;
  name?: string;
  email?: string;
    token?: string;
  // Add other user properties as needed
} | null;

type UserContextType = {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
};

// Create the context with default values
export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

type UserProviderProps = {
  children: ReactNode;
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Add this to your userContext.tsx file
export const useUser = () => {
    const context = React.useContext(UserContext);
    if (context === undefined) {
      throw new Error('useUser must be used within a UserProvider');
    }
    return context;
  };