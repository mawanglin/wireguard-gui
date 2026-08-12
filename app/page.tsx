'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { getVersion } from '@tauri-apps/api/app';
import { Lock, PowerOff, Unlock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  CommandError,
  connect,
  disconnect,
  lockProfiles,
  resetAppData,
  useAppLoader,
  useAppState,
} from '@/lib/effects';
import { useErrorMessage } from '@/lib/i18n/error';
import { Button } from '@/components/ui/button';
import { AppLoader } from '@/components/app-loader';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ProfileTable } from '@/components/profile-table';
import { SecurityControls, UnlockPanel } from '@/components/security-controls';
import { AppSplashScreen } from '@/components/app-splash-screen';

const DEFAULT_INACTIVITY_LOCK_MS = 10_000;
const inactivityLockMsEnv = Number(
  process.env.NEXT_PUBLIC_INACTIVITY_LOCK_MS ?? '10000',
);
const INACTIVITY_LOCK_MS =
  Number.isFinite(inactivityLockMsEnv) && inactivityLockMsEnv > 0
    ? inactivityLockMsEnv
    : DEFAULT_INACTIVITY_LOCK_MS;

export default function Index() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const [showSplash, setShowSplash] = useState(true);
  const [state, , , , fetchState] = useAppState();
  const [appLoader, setAppLoader] = useAppLoader();
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    getVersion()
      .then((v) => {
        setAppVersion(v);
      })
      .catch(() => {
        setAppVersion('unknown');
      })
      .finally(() => {
        setTimeout(() => setShowSplash(false), 1000);
      });
  }, []);

  const onConnectionFinish = useCallback(() => {
    return () => {
      fetchState();
      setAppLoader((l) => ({ ...l, isOpen: false }));
    };
  }, [fetchState, setAppLoader]);

  const onError = useCallback(
    (commandError: CommandError) => {
      toast.error(t('app.connectionError'), {
        description: errorMessage(commandError),
      });
    },
    [t, errorMessage],
  );

  const onConnect = useCallback(
    (profile: string) => {
      return () => {
        setAppLoader({
          kind: 'Connecting',
          isOpen: true,
          message: t('app.connecting', { profile }),
        });
        connect(profile, onConnectionFinish(), onError);
      };
    },
    [setAppLoader, onConnectionFinish, onError, t],
  );

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const onDisconnect = useCallback(() => {
    setAppLoader({
      kind: 'Disconnecting',
      isOpen: true,
      message: t('app.disconnecting', { profile: state.current }),
    });
    disconnect(onConnectionFinish(), onError);
  }, [state, setAppLoader, onConnectionFinish, onError, t]);

  const onResetAppData = useCallback(() => {
    resetAppData(
      () => {
        toast.success(t('app.resetSuccess'));
        fetchState();
      },
      (commandError) => {
        toast.error(t('app.resetFailed'), {
          description: errorMessage(commandError),
        });
      },
    );
  }, [fetchState, t, errorMessage]);

  useEffect(() => {
    if (!state?.encryption_enabled || !state?.is_unlocked) {
      return;
    }

    let timeoutId: number | undefined;
    let disposed = false;

    const scheduleLock = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        if (disposed) {
          return;
        }
        lockProfiles(
          () => {
            fetchState();
            toast.info(t('app.lockedByInactivity'));
          },
          () => undefined,
        );
      }, INACTIVITY_LOCK_MS);
    };

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ];

    for (const eventName of events) {
      window.addEventListener(eventName, scheduleLock, { passive: true });
    }
    scheduleLock();

    return () => {
      disposed = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      for (const eventName of events) {
        window.removeEventListener(eventName, scheduleLock);
      }
    };
  }, [state?.encryption_enabled, state?.is_unlocked, fetchState, t]);

  return (
    <div className="bg-background h-screen">
      {showSplash && <AppSplashScreen />}
      <AppLoader {...appLoader} />
      <div className="m-auto flex max-w-(--breakpoint-lg) flex-col px-4 pt-4">
        <div className="mb-8 flex items-center justify-between">
          <Image
            title={t('app.logoTitle')}
            alt={t('app.logoAlt')}
            src="/img/wireguard.png"
            width={42}
            height={42}
            loading="eager"
          />
          <div className="ml-2 flex items-center gap-2">
            <LanguageSwitcher />
            <SecurityControls
              encryptionEnabled={state?.encryption_enabled}
              isUnlocked={state?.is_unlocked}
              onStateChanged={fetchState}
            />
            <Button
              disabled={state?.conn_st !== 'Connected'}
              title={t('app.disconnect')}
              variant={state?.conn_st === 'Connected' ? 'destructive' : null}
              onClick={onDisconnect}
            >
              <PowerOff className="size-4" />
            </Button>
          </div>
        </div>
        <div className="mb-8 flex flex-col items-center justify-center">
          {state.conn_st === 'Connected' ? (
            <Lock className="mb-2 size-16 text-green-500" />
          ) : (
            <Unlock className="animate-pulsemb-2 size-16 text-red-500" />
          )}
          <p className="mt-2 font-bold">
            {state.current || t('app.notConnected')}
          </p>
          <p className="font-bold">{state?.pub_ip || t('app.ipUndetected')}</p>
        </div>
        {state?.encryption_enabled && !state?.is_unlocked ? (
          <UnlockPanel onUnlocked={fetchState} onReset={onResetAppData} />
        ) : (
          <Suspense>
            <ProfileTable current={state?.current} onConnect={onConnect} />
          </Suspense>
        )}
      </div>
      {/* setup the footer at the very end of the window */}
      <footer className="fixed bottom-0 right-4 h-8 text-sm text-muted-foreground">
        <strong>v{appVersion}</strong>
      </footer>
    </div>
  );
}
