import React, { useState } from 'react';
import { Check, ChevronsUpDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LANGUAGES } from '../data/languages';
import { useTranslation } from '../hooks/useTranslation';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  latestDetectedLanguage?: string;
}

const AUTO_OPTION = { code: 'auto', name: 'Auto-detect', nativeName: 'Auto' };

export default function LanguageSelector({ value, onChange, latestDetectedLanguage }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const selectedLanguage =
    value === 'auto'
      ? AUTO_OPTION
      : LANGUAGES.find((l) => l.code === value) || AUTO_OPTION;

  const displayLabel =
    value === 'auto' && latestDetectedLanguage && latestDetectedLanguage !== 'unknown'
      ? `Auto (${latestDetectedLanguage.toUpperCase()})`
      : selectedLanguage.name;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-44 justify-between text-xs h-8"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{displayLabel}</span>
            {value === 'auto' && latestDetectedLanguage && latestDetectedLanguage !== 'unknown' && (
              <Badge variant="secondary" className="text-xs px-1 py-0 h-4 ml-1">
                {latestDetectedLanguage.toUpperCase()}
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={t('languageSelector.searchLanguages')} className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="auto"
                onSelect={() => {
                  onChange('auto');
                  setOpen(false);
                }}
                className="text-xs"
              >
                <Check
                  className={cn('mr-2 h-3.5 w-3.5', value === 'auto' ? 'opacity-100' : 'opacity-0')}
                />
                <span className="font-medium">Auto-detect</span>
                {latestDetectedLanguage && latestDetectedLanguage !== 'unknown' && (
                  <Badge variant="secondary" className="ml-auto text-xs px-1 py-0 h-4">
                    {latestDetectedLanguage.toUpperCase()}
                  </Badge>
                )}
              </CommandItem>
              {LANGUAGES.map((lang) => (
                <CommandItem
                  key={lang.code}
                  value={`${lang.name} ${lang.nativeName} ${lang.code}`}
                  onSelect={() => {
                    onChange(lang.code);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn('mr-2 h-3.5 w-3.5', value === lang.code ? 'opacity-100' : 'opacity-0')}
                  />
                  <span>{lang.name}</span>
                  <span className="ml-1 text-muted-foreground">({lang.nativeName})</span>
                  <span className="ml-auto text-muted-foreground font-mono">{lang.code.toUpperCase()}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
