'use client';

import React from 'react';
import { KeyRound, RotateCcw, Shield, ShieldOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  disableProfileEncryption,
  enableProfileEncryption,
  lockProfiles,
  resetAppData,
  unlockProfiles,
} from '@/lib/effects';
import { useErrorMessage } from '@/lib/i18n/error';
import { AlertConfirm } from '@/components/ui/alert-confirm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

function isPinFormatValid(pin: string) {
  return /^\d{4}$/.test(pin);
}

export interface SecurityControlsProps {
  encryptionEnabled?: boolean;
  isUnlocked?: boolean;
  onStateChanged: () => void;
}

export function SecurityControls({
  encryptionEnabled,
  isUnlocked,
  onStateChanged,
}: SecurityControlsProps) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const [enablePin, setEnablePin] = React.useState('');
  const [disablePin, setDisablePin] = React.useState('');
  const [confirmResetOpen, setConfirmResetOpen] = React.useState(false);

  const onEnable = React.useCallback(() => {
    if (!isPinFormatValid(enablePin)) {
      toast.error(t('security.invalidPinTitle'), {
        description: t('security.invalidPinDescription'),
      });
      return;
    }
    enableProfileEncryption(
      enablePin,
      () => {
        setEnablePin('');
        toast.success(t('security.enableSuccess'));
        onStateChanged();
      },
      (error) =>
        toast.error(t('security.enableFailed'), {
          description: errorMessage(error),
        }),
    );
  }, [enablePin, onStateChanged, t, errorMessage]);

  const onDisable = React.useCallback(() => {
    if (!isPinFormatValid(disablePin)) {
      toast.error(t('security.invalidPinTitle'), {
        description: t('security.invalidPinDescription'),
      });
      return;
    }
    disableProfileEncryption(
      disablePin,
      () => {
        setDisablePin('');
        toast.success(t('security.disableSuccess'));
        onStateChanged();
      },
      (error) =>
        toast.error(t('security.disableFailed'), {
          description: errorMessage(error),
        }),
    );
  }, [disablePin, onStateChanged, t, errorMessage]);

  const onLockNow = React.useCallback(() => {
    lockProfiles(
      () => {
        toast.success(t('security.lockSuccess'));
        onStateChanged();
      },
      (error) =>
        toast.error(t('security.lockFailed'), {
          description: errorMessage(error),
        }),
    );
  }, [onStateChanged, t, errorMessage]);

  const onConfirmReset = React.useCallback(() => {
    resetAppData(
      () => {
        setConfirmResetOpen(false);
        setEnablePin('');
        setDisablePin('');
        toast.success(t('app.resetSuccess'));
        onStateChanged();
      },
      (error) => {
        toast.error(t('app.resetFailed'), {
          description: errorMessage(error),
        });
      },
    );
  }, [onStateChanged, t, errorMessage]);

  return (
    <>
      <AlertConfirm
        isOpen={confirmResetOpen}
        setOpen={setConfirmResetOpen}
        onConfirm={onConfirmReset}
        title={t('security.resetTitle')}
        description={t('security.resetDescription')}
      />
      <Dialog>
        <DialogTrigger asChild>
          <Button
            title={t('security.openTitle')}
            variant="outline"
            size="icon"
            data-testid="security-open"
          >
            <Shield className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent aria-describedby="security-dialog">
          <DialogHeader>
            <DialogTitle>{t('security.dialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!encryptionEnabled ? (
              <form
                className="space-y-2"
                data-testid="security-enable-section"
                onSubmit={(event) => {
                  event.preventDefault();
                  onEnable();
                }}
              >
                <p className="text-sm text-muted-foreground">
                  {t('security.enableHint')}
                </p>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder={t('security.pinPlaceholder')}
                  value={enablePin}
                  onChange={(e) =>
                    setEnablePin(e.target.value.replace(/\D/g, ''))
                  }
                  data-testid="security-enable-pin"
                />
                <Button
                  type="submit"
                  className="w-full"
                  data-testid="security-enable-submit"
                >
                  <KeyRound className="size-4" />
                  {t('security.enableAction')}
                </Button>
              </form>
            ) : (
              <form
                className="space-y-2"
                data-testid="security-disable-section"
                onSubmit={(event) => {
                  event.preventDefault();
                  onDisable();
                }}
              >
                <p className="text-sm text-muted-foreground">
                  {t('security.activeHint')}
                </p>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder={t('security.currentPinPlaceholder')}
                  value={disablePin}
                  onChange={(e) =>
                    setDisablePin(e.target.value.replace(/\D/g, ''))
                  }
                  data-testid="security-disable-pin"
                />
                <Button
                  type="submit"
                  className="w-full"
                  data-testid="security-disable-submit"
                >
                  <ShieldOff className="size-4" />
                  {t('security.disableAction')}
                </Button>
                {isUnlocked ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={onLockNow}
                    data-testid="security-lock-now"
                  >
                    {t('security.lockNow')}
                  </Button>
                ) : null}
              </form>
            )}

            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => setConfirmResetOpen(true)}
              data-testid="security-reset"
            >
              <RotateCcw className="size-4" />
              {t('security.resetAction')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export interface UnlockPanelProps {
  onUnlocked: () => void;
  onReset: () => void;
}

export function UnlockPanel({ onUnlocked, onReset }: UnlockPanelProps) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const [pin, setPin] = React.useState('');

  const onUnlock = React.useCallback(() => {
    if (!isPinFormatValid(pin)) {
      toast.error(t('security.invalidPinTitle'), {
        description: t('security.invalidPinDescription'),
      });
      return;
    }
    unlockProfiles(
      pin,
      () => {
        setPin('');
        toast.success(t('security.unlockSuccess'));
        onUnlocked();
      },
      (error) =>
        toast.error(t('security.unlockFailed'), {
          description: errorMessage(error),
        }),
    );
  }, [pin, onUnlocked, t, errorMessage]);

  return (
    <div className="rounded-lg border p-6" data-testid="unlock-panel">
      <h2 className="mb-2 text-lg font-semibold">
        {t('security.lockedTitle')}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {t('security.lockedHint')}
      </p>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onUnlock();
        }}
      >
        <Input
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder={t('security.pinPlaceholder')}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          data-testid="unlock-pin"
        />
        <Button type="submit" data-testid="unlock-submit">
          {t('security.unlockAction')}
        </Button>
      </form>
      <Button
        type="button"
        variant="destructive"
        className="mt-4 w-full"
        onClick={onReset}
        data-testid="unlock-reset"
      >
        {t('security.resetAction')}
      </Button>
    </div>
  );
}
