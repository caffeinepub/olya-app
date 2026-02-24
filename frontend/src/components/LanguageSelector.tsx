import React, { useState, useMemo } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LANGUAGES, getLanguageByCode } from '@/data/languages';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
  detectedLanguage?: string | null;
  disabled?: boolean;
}

export default function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  detectedLanguage,
  disabled = false,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (selectedLanguage === 'auto') return 'Auto-detect';
    const lang = getLanguageByCode(selectedLanguage);
    return lang ? lang.name : selectedLanguage;
  }, [selectedLanguage]);

  const handleSelect = (code: string) => {
    onLanguageChange(code);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              'h-8 text-xs bg-background/50 border-border/50 gap-1.5 max-w-[180px] justify-between',
              selectedLanguage === 'auto' && 'text-primary border-primary/40'
            )}
          >
            <span className="truncate">{selectedLabel}</span>
            <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search language..." className="h-9 text-xs" />
            <CommandList className="max-h-64">
              <CommandEmpty>No language found.</CommandEmpty>
              <CommandGroup heading="Default">
                <CommandItem
                  value="auto"
                  onSelect={() => handleSelect('auto')}
                  className="text-xs gap-2"
                >
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium text-primary">Auto-detect</span>
                  <span className="text-muted-foreground ml-auto text-[10px]">
                    Browser default
                  </span>
                  {selectedLanguage === 'auto' && (
                    <Check className="w-3.5 h-3.5 text-primary ml-1" />
                  )}
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Languages">
                {LANGUAGES.map((lang) => (
                  <CommandItem
                    key={lang.code}
                    value={`${lang.name} ${lang.nativeName ?? ''} ${lang.code}`}
                    onSelect={() => handleSelect(lang.code)}
                    className="text-xs gap-2"
                  >
                    <span className="flex-1 truncate">{lang.name}</span>
                    {lang.nativeName && lang.nativeName !== lang.name && (
                      <span className="text-muted-foreground text-[10px] truncate max-w-[80px]">
                        {lang.nativeName}
                      </span>
                    )}
                    <span className="text-muted-foreground/60 text-[10px] font-mono shrink-0">
                      {lang.code}
                    </span>
                    {selectedLanguage === lang.code && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Detected language badge (shown when auto-detect is active and a language was detected) */}
      {selectedLanguage === 'auto' && detectedLanguage && (
        <Badge
          variant="outline"
          className="text-[10px] h-5 px-1.5 border-primary/30 text-primary bg-primary/5 font-mono"
        >
          Detected: {detectedLanguage}
        </Badge>
      )}
    </div>
  );
}
