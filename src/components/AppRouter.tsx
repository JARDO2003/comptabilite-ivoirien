import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ViewName } from '@/types';

interface RouterContextType {
  currentView: ViewName;
  navigate: (view: ViewName) => void;
}

const RouterContext = createContext<RouterContextType>({
  currentView: 'dashboard',
  navigate: () => {}
});

export function AppRouter({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewName>('dashboard');
  return (
    <RouterContext.Provider value={{ currentView, navigate: setCurrentView }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useNavigate() {
  return useContext(RouterContext);
}

export { RouterContext };
