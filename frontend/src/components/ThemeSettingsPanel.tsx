import React from 'react';
import { Check, Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useThemeContext } from '../contexts/ThemeContext';
import type { ThemeName } from '../hooks/useTheme';

interface ThemeOption {
  id: ThemeName;
  label: string;
  description: string;
  swatches: string[];
}

const THEMES: ThemeOption[] = [
  {
    id: 'ocean-teal',
    label: 'Ocean Teal',
    description: 'Deep navy with teal accents',
    swatches: ['oklch(0.13 0.02 240)', 'oklch(0.72 0.18 185)', 'oklch(0.75 0.18 55)', 'oklch(0.65 0.15 280)'],
  },
  {
    id: 'midnight-slate',
    label: 'Midnight Slate',
    description: 'Cool slate with violet highlights',
    swatches: ['oklch(0.12 0.015 260)', 'oklch(0.68 0.20 270)', 'oklch(0.72 0.16 220)', 'oklch(0.62 0.18 300)'],
  },
  {
    id: 'ember-amber',
    label: 'Ember Amber',
    description: 'Warm dark with amber glow',
    swatches: ['oklch(0.12 0.02 30)', 'oklch(0.78 0.20 55)', 'oklch(0.70 0.22 25)', 'oklch(0.65 0.18 80)'],
  },
  {
    id: 'forest-green',
    label: 'Forest Green',
    description: 'Rich forest with emerald tones',
    swatches: ['oklch(0.12 0.02 160)', 'oklch(0.68 0.20 145)', 'oklch(0.72 0.18 185)', 'oklch(0.65 0.16 120)'],
  },
];

export default function ThemeSettingsPanel() {
  const { currentTheme, currentMode, setTheme, toggleMode } = useThemeContext();

  return (
    <div className="w-80 p-4 space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground tracking-wide">App Visual Theme</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Customize the look and feel of Olya</p>
      </div>

      {/* Light / Dark Mode Toggle */}
      <div className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border">
        <div className="flex items-center gap-2">
          {currentMode === 'dark' ? (
            <Moon className="w-4 h-4 text-primary" />
          ) : (
            <Sun className="w-4 h-4 text-primary" />
          )}
          <div>
            <Label className="text-xs font-medium text-foreground cursor-pointer">
              {currentMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </Label>
            <p className="text-xs text-muted-foreground">
              {currentMode === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'}
            </p>
          </div>
        </div>
        <Switch
          checked={currentMode === 'dark'}
          onCheckedChange={toggleMode}
          aria-label="Toggle dark mode"
        />
      </div>

      {/* Mode quick-select buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => { if (currentMode !== 'light') toggleMode(); }}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium border transition-all',
            currentMode === 'light'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
          )}
        >
          <Sun className="w-3.5 h-3.5" />
          Light
        </button>
        <button
          onClick={() => { if (currentMode !== 'dark') toggleMode(); }}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium border transition-all',
            currentMode === 'dark'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
          )}
        >
          <Moon className="w-3.5 h-3.5" />
          Dark
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Color Theme Selection */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Color Palette</p>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((theme) => {
            const isActive = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={cn(
                  'relative flex flex-col gap-2 p-3 rounded-md border text-left transition-all',
                  isActive
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40'
                )}
              >
                {/* Active checkmark */}
                {isActive && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </span>
                )}

                {/* Color swatches */}
                <div className="flex gap-1">
                  {theme.swatches.map((color, i) => (
                    <span
                      key={i}
                      className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0"
                      style={{ background: color }}
                    />
                  ))}
                </div>

                {/* Labels */}
                <div>
                  <p className="text-xs font-semibold text-foreground leading-tight">{theme.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">{theme.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
