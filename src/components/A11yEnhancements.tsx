import React, { useEffect, useRef } from 'react';
import { a11y } from '@/utils/performance';

// Skip to content link for keyboard navigation
export const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:transition-all"
    >
      Skip to main content
    </a>
  );
};

// Focus trap for modal dialogs
interface FocusTrapProps {
  children: React.ReactNode;
  active: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ children, active }) => {
  const trapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !trapRef.current) return;

    const cleanup = a11y.trapFocus(trapRef.current);
    return cleanup;
  }, [active]);

  return (
    <div ref={trapRef} className="focus-trap">
      {children}
    </div>
  );
};

// Announcement component for screen readers
interface AnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  children?: React.ReactNode;
}

export const Announcement: React.FC<AnnouncementProps> = ({ 
  message, 
  priority = 'polite', 
  children 
}) => {
  useEffect(() => {
    if (message) {
      a11y.announce(message, priority);
    }
  }, [message, priority]);

  return <>{children}</>;
};

// High contrast mode toggle
export const HighContrastToggle: React.FC = () => {
  const [highContrast, setHighContrast] = React.useState(false);

  useEffect(() => {
    const savedSetting = localStorage.getItem('high-contrast');
    if (savedSetting === 'true') {
      setHighContrast(true);
      document.body.classList.add('high-contrast');
    }
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('high-contrast', newValue.toString());
    
    if (newValue) {
      document.body.classList.add('high-contrast');
      a11y.announce('High contrast mode enabled');
    } else {
      document.body.classList.remove('high-contrast');
      a11y.announce('High contrast mode disabled');
    }
  };

  return (
    <button
      onClick={toggleHighContrast}
      className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast mode`}
      aria-pressed={highContrast}
    >
      <span className="sr-only">
        {highContrast ? 'Disable' : 'Enable'} high contrast mode
      </span>
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 0 0 20V2z" fill="currentColor" />
      </svg>
    </button>
  );
};

// Font size adjuster
export const FontSizeAdjuster: React.FC = () => {
  const [fontSize, setFontSize] = React.useState(100);

  useEffect(() => {
    const savedSize = localStorage.getItem('font-size');
    if (savedSize) {
      const size = parseInt(savedSize, 10);
      setFontSize(size);
      document.documentElement.style.fontSize = `${size}%`;
    }
  }, []);

  const adjustFontSize = (delta: number) => {
    const newSize = Math.max(80, Math.min(140, fontSize + delta));
    setFontSize(newSize);
    localStorage.setItem('font-size', newSize.toString());
    document.documentElement.style.fontSize = `${newSize}%`;
    
    a11y.announce(`Font size set to ${newSize}%`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => adjustFontSize(-10)}
        className="p-1 rounded border hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Decrease font size"
        disabled={fontSize <= 80}
      >
        A-
      </button>
      <span className="text-sm font-medium">{fontSize}%</span>
      <button
        onClick={() => adjustFontSize(10)}
        className="p-1 rounded border hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Increase font size"
        disabled={fontSize >= 140}
      >
        A+
      </button>
    </div>
  );
};

// Keyboard navigation helper
interface KeyboardNavigationProps {
  onEscape?: () => void;
  onEnter?: () => void;
  children: React.ReactNode;
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  onEscape,
  onEnter,
  children
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onEscape?.();
          break;
        case 'Enter':
          if (e.target === document.body || (e.target as HTMLElement).tagName === 'BUTTON') {
            onEnter?.();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onEnter]);

  return <>{children}</>;
};

// Accessible table with proper headers and navigation
interface AccessibleTableProps {
  headers: string[];
  data: any[][];
  caption: string;
  className?: string;
}

export const AccessibleTable: React.FC<AccessibleTableProps> = ({
  headers,
  data,
  caption,
  className = ''
}) => {
  const tableId = a11y.generateId('table');

  return (
    <div className={`overflow-auto ${className}`}>
      <table
        id={tableId}
        className="w-full border-collapse border border-gray-300"
        role="table"
        aria-label={caption}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="border border-gray-300 px-4 py-2 bg-gray-100 text-left font-semibold"
                scope="col"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border border-gray-300 px-4 py-2"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Live region for dynamic content updates
interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'polite',
  className = ''
}) => {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  );
};

// Progress indicator with accessibility features
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label: string;
  description?: string;
  className?: string;
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  description,
  className = ''
}) => {
  const progressId = a11y.generateId('progress');
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={progressId} className="text-sm font-medium">
          {label}
        </label>
        <span aria-hidden="true" className="text-sm text-gray-600">
          {percentage}%
        </span>
      </div>
      <progress
        id={progressId}
        value={value}
        max={max}
        className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
        aria-describedby={description ? `${progressId}-desc` : undefined}
      >
        {percentage}%
      </progress>
      {description && (
        <div id={`${progressId}-desc`} className="text-xs text-gray-500 mt-1">
          {description}
        </div>
      )}
      <LiveRegion message={`Progress: ${percentage}% complete`} />
    </div>
  );
};