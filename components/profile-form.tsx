'use client';

import { useCallback, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

import { ProfilePartial } from '@/types/profile';
import { createProfile, updateProfile } from '@/lib/effects';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { Textarea } from './ui/textarea';

const contentPlaceholder = `[Interface]
Address =
PrivateKey =
ListenPort = 51820
DNS =

[Peer]
PublicKey =
PresharedKey =
Endpoint =
AllowedIPs =
`;

interface ProfileFormProps {
  data?: ProfilePartial | null;
  editId?: string | null;
  afterSubmit?: (profile: ProfilePartial) => void;
}

export default function ProfileForm({
  data,
  editId,
  afterSubmit,
}: ProfileFormProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // schema 必须随 t 重建：留在模块作用域会把校验消息固化在模块加载时的语言上
  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, { message: t('profile.validationName') }),
        content: z.string().min(8, { message: t('profile.validationContent') }),
      }),
    [t],
  );
  const defaultValues = useMemo(
    () =>
      data || {
        name: '',
        content: '',
      },
    [data],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const onSubmit = useCallback(
    (profile: z.infer<typeof formSchema>) => {
      setIsLoading(true);
      if (editId) {
        updateProfile(
          editId,
          profile,
          () => afterSubmit?.(profile),
          (err) => setError(err.message ? err.message : err),
          () => setIsLoading(false),
        );
      } else {
        createProfile(
          profile,
          () => afterSubmit?.(profile),
          (err) => setError(err.message ? err.message : err),
          () => setIsLoading(false),
        );
      }
    },
    [editId, afterSubmit],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile.fieldName')}</FormLabel>
              <FormControl>
                <Input
                  placeholder="wgnet0"
                  {...field}
                  disabled={!!editId}
                  data-testid="profile-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>{t('profile.fieldContent')}</FormLabel>
              <FormControl>
                <Textarea
                  className="h-[280px] resize-none"
                  placeholder={contentPlaceholder}
                  {...field}
                  data-testid="profile-content"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error ? <div className="text-sm text-red-500">{error}</div> : null}
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          type="submit"
          disabled={isLoading}
          data-testid="profile-save"
        >
          {isLoading ? t('common.loading') : t('common.save')}
        </Button>
      </form>
    </Form>
  );
}
