// ==========================================
// SISTEMA DE DESIGN UNIFICADO - VALDIGLEY SANTOS
// ==========================================
// Componentes padronizados para todos os sistemas

import React from 'react';

// ==========================================
// INTERFACES
// ==========================================

interface VSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'purple' | 'success' | 'danger' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

interface VSCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

interface VSLogoProps {
  title: string;
  subtitle?: string;
  icon?: string;
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface VSHeaderProps {
  logo: VSLogoProps;
  navigation?: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
  }>;
  actions?: React.ReactNode;
  theme?: 'drive' | 'contratos' | 'formatura';
}

interface VSStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

interface VSPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

interface VSInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

interface VSModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// ==========================================
// COMPONENTE: VS BUTTON
// ==========================================

export function VSButton({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  icon, 
  children, 
  className = '', 
  disabled,
  ...props 
}: VSButtonProps) {
  const baseClasses = 'vs-btn';
  const variantClasses = `vs-btn-${variant}`;
  const sizeClasses = size !== 'md' ? `vs-btn-${size}` : '';
  
  const classes = [baseClasses, variantClasses, sizeClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button 
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="vs-loading" />}
      {!loading && icon && icon}
      {children}
    </button>
  );
}

// ==========================================
// COMPONENTE: VS CARD
// ==========================================

export function VSCard({ children, className = '', hover = true }: VSCardProps) {
  const classes = ['vs-card', hover ? 'vs-hover-lift' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
}

export function VSCardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`vs-card-header ${className}`}>
      {children}
    </div>
  );
}

export function VSCardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`vs-card-body ${className}`}>
      {children}
    </div>
  );
}

// ==========================================
// COMPONENTE: VS INPUT
// ==========================================

export function VSInput({ label, error, icon, className = '', ...props }: VSInputProps) {
  return (
    <div className="vs-form-group">
      {label && (
        <label className="vs-form-label">
          {label}
        </label>
      )}
      
      <div className="vs-relative">
        {icon && (
          <div className="vs-absolute vs-inset-y-0 vs-left-0 vs-pl-3 vs-flex vs-items-center vs-pointer-events-none">
            <span className="vs-text-tertiary">{icon}</span>
          </div>
        )}
        
        <input
          className={`vs-input ${icon ? 'vs-pl-10' : ''} ${error ? 'vs-border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      
      {error && (
        <p className="vs-form-error">{error}</p>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE: VS MODAL
// ==========================================

export function VSModal({ isOpen, onClose, title, children, size = 'md' }: VSModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'vs-max-w-md',
    md: 'vs-max-w-lg',
    lg: 'vs-max-w-2xl',
    xl: 'vs-max-w-4xl',
  };

  return (
    <div className="vs-modal-backdrop">
      <div className={`vs-modal ${sizeClasses[size]}`}>
        {title && (
          <div className="vs-card-header vs-flex vs-items-center vs-justify-between">
            <h3 className="vs-heading-3 vs-mb-0">{title}</h3>
            <button
              onClick={onClose}
              className="vs-btn vs-btn-ghost vs-btn-sm"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="vs-card-body">
          {children}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: VS LOGO UNIFICADA
// ==========================================

export function VSLogo({ title, subtitle, icon, logoUrl, size = 'md' }: VSLogoProps) {
  const sizeClasses = {
    sm: { icon: 'vs-w-8 vs-h-8', title: 'vs-text-lg', subtitle: 'vs-text-xs' },
    md: { icon: 'vs-w-10 vs-h-10', title: 'vs-text-xl', subtitle: 'vs-text-sm' },
    lg: { icon: 'vs-w-12 vs-h-12', title: 'vs-text-2xl', subtitle: 'vs-text-base' }
  };

  const sizes = sizeClasses[size];

  return (
    <div className="vs-logo">
      <div className={`vs-logo-icon ${sizes.icon}`}>
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={title}
            className="vs-w-full vs-h-full vs-object-contain vs-rounded"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.fallback-icon');
              if (fallback) {
                (fallback as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div className="fallback-icon vs-w-full vs-h-full vs-flex vs-items-center vs-justify-center" style={{ display: logoUrl ? 'none' : 'flex' }}>
          {icon || '📸'}
        </div>
      </div>
      <div className="vs-logo-text">
        <div className={`vs-logo-title ${sizes.title}`}>{title}</div>
        {subtitle && <div className={`vs-logo-subtitle ${sizes.subtitle}`}>{subtitle}</div>}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: VS HEADER UNIFICADO
// ==========================================

export function VSHeader({ logo, navigation, actions, theme = 'drive' }: VSHeaderProps) {
  return (
    <header className={`vs-header vs-theme-${theme}`}>
      <div className="vs-header-content">
        <VSLogo {...logo} />
        
        {navigation && navigation.length > 0 && (
          <nav className="vs-nav">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`vs-nav-item ${item.active ? 'active' : ''}`}
              >
                {item.icon}
                <span className="vs-hidden md:vs-inline">{item.label}</span>
              </button>
            ))}
          </nav>
        )}
        
        {actions && (
          <div className="vs-header-actions">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

// ==========================================
// COMPONENTE: VS STAT CARD
// ==========================================

export function VSStatCard({ title, value, icon, trend, color = 'blue' }: VSStatCardProps) {
  const colorClasses = {
    blue: 'vs-text-blue-500',
    green: 'vs-text-green-500',
    purple: 'vs-text-purple-500',
    orange: 'vs-text-orange-500',
    red: 'vs-text-red-500'
  };

  return (
    <div className="vs-stat-card">
      <div className="vs-stat-content">
        <div className="vs-stat-info">
          <h3>{title}</h3>
          <div className="vs-stat-value">{value}</div>
          {trend && (
            <div className={`vs-text-sm vs-mt-2 ${colorClasses[color]}`}>
              {trend}
            </div>
          )}
        </div>
        <div className="vs-stat-icon">
          <div className={colorClasses[color]}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: VS PAGE HEADER
// ==========================================

export function VSPageHeader({ title, subtitle, actions }: VSPageHeaderProps) {
  return (
    <div className="vs-page-header">
      <div className="vs-page-title">
        <div>
          <h1 className="vs-heading-1">{title}</h1>
          {subtitle && <p className="vs-page-subtitle">{subtitle}</p>}
        </div>
        {actions && (
          <div className="vs-flex vs-gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: VS LOADING SPINNER
// ==========================================

export function VSLoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'vs-h-4 vs-w-4',
    md: 'vs-h-8 vs-w-8',
    lg: 'vs-h-12 vs-w-12',
  };

  return (
    <div className={`vs-loading ${sizeClasses[size]} ${className}`} />
  );
}

// ==========================================
// COMPONENTE: VS EMPTY STATE
// ==========================================

export function VSEmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="vs-empty-state">
      <div className="vs-empty-icon">
        {icon}
      </div>
      <h3 className="vs-empty-title">{title}</h3>
      {description && (
        <p className="vs-empty-description">{description}</p>
      )}
      {action && action}
    </div>
  );
}

// ==========================================
// HOOK: VS THEME
// ==========================================

export function useVSTheme() {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vs-darkMode');
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vs-darkMode', JSON.stringify(isDarkMode));
      
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const setDarkMode = (isDark: boolean) => setIsDarkMode(isDark);

  return { isDarkMode, toggleDarkMode, setDarkMode };
}

// ==========================================
// COMPONENTE: VS THEME TOGGLE
// ==========================================

export function VSThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useVSTheme();

  return (
    <VSButton
      variant="secondary"
      size="sm"
      onClick={toggleDarkMode}
      icon={isDarkMode ? '☀️' : '🌙'}
      title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
    >
      <span className="vs-hidden md:vs-inline">
        {isDarkMode ? 'Claro' : 'Escuro'}
      </span>
    </VSButton>
  );
}

// ==========================================
// TEMPLATE PARA DRIVE
// ==========================================

export function DriveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="vs-app vs-theme-drive">
      {children}
    </div>
  );
}

// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {
  VSButton,
  VSCard,
  VSCardHeader,
  VSCardBody,
  VSInput,
  VSModal,
  VSLogo,
  VSHeader,
  VSStatCard,
  VSPageHeader,
  VSLoadingSpinner,
  VSEmptyState,
  VSThemeToggle,
  useVSTheme,
  DriveLayout
};