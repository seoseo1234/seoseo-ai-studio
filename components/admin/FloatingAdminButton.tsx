import React from 'react';
import { Settings } from 'lucide-react';
import { usePortalStore } from '../../store/usePortalStore';
import { Button } from '../ui/Button';

interface FloatingAdminButtonProps {
  onClick: () => void;
}

export const FloatingAdminButton: React.FC<FloatingAdminButtonProps> = ({ onClick }) => {
  const { isAdmin } = usePortalStore();

  if (isAdmin) return null;

  // If already admin, clicking might open the App Form Modal directly.
  // This button primarily serves as the entry point.
  return (
    <Button 
      variant="frap" 
      onClick={onClick}
      aria-label="Admin Settings"
      icon={<Settings size={24} />}
    >
      {/* Intentionally empty children, icon is passed as prop */}
    </Button>
  );
};
