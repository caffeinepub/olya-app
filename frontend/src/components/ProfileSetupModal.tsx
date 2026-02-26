import React, { useState } from 'react';
import { Shield, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileSetupModalProps {
  onSave?: (name: string) => Promise<void>;
  isSaving?: boolean;
}

export default function ProfileSetupModal({ onSave, isSaving = false }: ProfileSetupModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSave?.(trimmed);
  };

  return (
    <Dialog open={true}>
      <DialogContent
        className="bg-card border-border/60 max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-primary" />
            <DialogTitle className="font-mono text-sm tracking-wider text-foreground">
              OPERATOR PROFILE SETUP
            </DialogTitle>
          </div>
          <DialogDescription className="text-[11px] font-mono text-muted-foreground/70">
            Establish your operator identity to access the Olya Intelligence System.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider"
            >
              Operator Name
            </Label>
            <div className="relative">
              <User
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary/50"
              />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="pl-7 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/40 font-mono text-xs focus:border-primary/50"
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!name.trim() || isSaving}
            className="w-full h-8 text-[11px] font-mono"
            variant="default"
          >
            {isSaving ? 'Initializing...' : 'Initialize Profile'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
