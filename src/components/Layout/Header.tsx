import React from 'react';
import { Camera, Moon, Sun, User } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { VSHeader, VSButton, VSThemeToggle } from '../UI/valdigley-design-system';

export function Header() {
  const { state, dispatch } = useAppContext();
  const { theme, currentUser } = state;

  return (
    <VSHeader
      logo={{
        title: "DriVal",
        subtitle: "Sistema de Fotos",
        icon: "📸"
      }}
      theme="drive"
      actions={
        <div className="vs-flex vs-items-center vs-gap-3">
          <VSThemeToggle />
        </div>
      }
    />
  );
}