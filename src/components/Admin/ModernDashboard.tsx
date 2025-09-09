import React, { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, Clock, Camera, CheckCircle } from 'lucide-react';
import { Sidebar } from '../Layout/Sidebar';
import { businessService } from '../../services/businessService';

export function ModernDashboard() {
  const [businessInfo, setBusinessInfo] = useState<any>(null);

  useEffect(() => {
    const loadBusinessInfo = async () => {
      const info = await businessService.getBusinessInfo();
      setBusinessInfo(info);
    };
    loadBusinessInfo();
  }, []);

  const stats = [
    {
      title: 'Sessões Hoje',
      value: '0',
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      title: 'Total de Clientes',
      value: '2',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'Faturamento',
      value: 'R$ 150,00',
      icon: DollarSign,
      color: 'bg-purple-500'
    },
    {
      title: 'Pendências',
      value: 'R$ 0,00',
      icon: Clock,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar businessInfo={businessInfo} />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Calendar size={16} />
              Novo Agendamento
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <stat.icon size={24} className="text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tipos de Sessão */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Tipos de Sessão</h3>
                <Camera size={20} className="text-slate-400" />
              </div>
              
              <div className="flex items-center justify-center h-48">
                {/* Donut Chart Placeholder */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-8 border-slate-700 relative">
                    <div className="absolute inset-0 rounded-full border-8 border-purple-500 border-t-transparent border-r-transparent transform rotate-45"></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-slate-300">🎂 Aniversário (1)</span>
                </div>
              </div>
            </div>

            {/* Sessões de Hoje */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Sessões de Hoje</h3>
                <Calendar size={20} className="text-slate-400" />
              </div>
              
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={24} className="text-slate-400" />
                  </div>
                  <p className="text-slate-400">Nenhuma sessão agendada para hoje</p>
                </div>
              </div>
            </div>
          </div>

          {/* Próximos Agendamentos */}
          <div className="mt-8">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Próximos Agendamentos</h3>
                <CheckCircle size={20} className="text-slate-400" />
              </div>
              
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar size={20} className="text-slate-400" />
                  </div>
                  <p className="text-slate-400">Nenhum agendamento futuro</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 border-t border-slate-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-slate-400 text-sm">
              Ativar o Windows
            </div>
            <div className="text-slate-400 text-sm">
              Acesse Configurações para ativar o Windows.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}