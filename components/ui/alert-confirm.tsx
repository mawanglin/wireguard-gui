import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface AlertConfirmProps {
  title?: string;
  isOpen?: boolean;
  description?: string;
  onConfirm?: () => void;
  setOpen?: (o: boolean) => void;
}

export function AlertConfirm({
  title,
  isOpen,
  description,
  setOpen,
  onConfirm,
}: AlertConfirmProps) {
  const { t } = useTranslation();
  const onCancel = useCallback(() => {
    setOpen?.(false);
  }, [setOpen]);
  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t('common.continue')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
