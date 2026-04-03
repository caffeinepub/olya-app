import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import React, { useState } from "react";
import { LANGUAGES } from "../data/languages";
import { useAppLanguagePreference } from "../hooks/useAppLanguagePreference";
import { useTranslation } from "../hooks/useTranslation";

interface AppLanguageSelectorFullProps {
  onContinue: () => void;
}

export function AppLanguageSelectorFull({
  onContinue,
}: AppLanguageSelectorFullProps) {
  const { language, setAppLanguage } = useAppLanguagePreference();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = LANGUAGES.filter((l) => {
    const nativeName = l.nativeName ?? "";
    return (
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">
            {t("languageSelector.selectLanguage")}
          </h2>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder={t("languageSelector.searchLanguages")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1 max-h-72 overflow-y-auto mb-6 pr-1">
          {filtered.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setAppLanguage(lang.code)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                language === lang.code
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              <span className="font-medium">{lang.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-70">
                  {lang.nativeName ?? ""}
                </span>
                <span className="text-xs font-mono opacity-50">
                  {lang.code.toUpperCase()}
                </span>
                {language === lang.code && <Check className="w-4 h-4" />}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No language found.
            </p>
          )}
        </div>

        <Button onClick={onContinue} className="w-full" disabled={!language}>
          {t("languageSelector.continue")}
        </Button>
      </div>
    </div>
  );
}

export function AppLanguageSelectorCompact() {
  const { language, setAppLanguage } = useAppLanguagePreference();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === language);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs px-2">
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-mono uppercase">
            {currentLang?.code || language || "EN"}
          </span>
          <ChevronsUpDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <Command>
          <CommandInput
            placeholder={t("languageSelector.searchLanguages")}
            className="h-8 text-xs"
          />
          <CommandList className="max-h-72">
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup heading={t("languageSelector.appLanguage")}>
              {LANGUAGES.map((lang) => (
                <CommandItem
                  key={lang.code}
                  value={`${lang.name} ${lang.nativeName ?? ""} ${lang.code}`}
                  onSelect={() => {
                    setAppLanguage(lang.code);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      language === lang.code ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span>{lang.name}</span>
                  <span className="ml-1 text-muted-foreground text-xs">
                    {lang.nativeName}
                  </span>
                  <span className="ml-auto text-muted-foreground font-mono text-xs">
                    {lang.code.toUpperCase()}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
