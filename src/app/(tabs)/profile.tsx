import { UserAvatar } from '@/components/ui/avatar';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { useLanguage } from '@/lib/i18n';

/** Redirect profile tab to account screen */
export default function ProfileScreen() {
  const { t } = useLanguage();

  return (
    <Screen title={t('profile.title')} subtitle={t('profile.subtitle')} headerAccessory={<UserAvatar />}>
      <AppText variant="caption" tone="muted">{t('profile.redirect')}</AppText>
    </Screen>
  );
}
