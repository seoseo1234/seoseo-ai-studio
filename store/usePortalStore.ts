import { create } from 'zustand';

interface PortalState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
}

export const usePortalStore = create<PortalState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedCategory: 'All',
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  theme: 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
    return { theme: newTheme };
  }),
  isAdmin: false,
  setIsAdmin: (isAdmin) => set({ isAdmin }),
}));
