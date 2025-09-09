import React from 'react';
import { 
  BarChart3, 
  Calendar, 
  Camera, 
  Users, 
  CreditCard, 
  Settings, 
  Sun, 
  LogOut 
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  businessInfo: any;
}

export function Sidebar({ businessInfo }: SidebarProps) {
  const { state } = useAppContext();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', active: true },
    { icon: Calendar, label: 'Agendamentos', active: false },
    { icon: Camera, label: 'Galerias', active: false },
    { icon: Users, label: 'Clientes', active: false },
    { icon: CreditCard, label: 'Pagamentos', active: false },
    { icon: Settings, label: 'Configurações', active: false },
  ];

  return (
    <div className="w-64 bg-slate-800 h-screen flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            {businessInfo?.logo_url ? (
              <img 
                src={businessInfo.logo_url} 
                alt="Logo" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-8 h-8 border-4 border-slate-800 rounded-full relative ${businessInfo?.logo_url ? 'hidden' : ''}`}>
              <div className="absolute inset-1 border-2 border-slate-800 rounded-full">
                <div className="absolute inset-0.5 bg-slate-800 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">
              {businessInfo?.name || 'Triagem'}
            </h1>
            <p className="text-slate-400 text-xs">By Valdigley Santos</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-6">
        <nav className="space-y-1 px-3">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-700 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
          <Sun size={20} />
          Modo Claro
        </button>
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </div>
  );
}