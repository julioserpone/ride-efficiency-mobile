import { UserAvatar } from '@/components/ui/avatar';
import { Screen } from '@/components/ui/screen';
import { useLanguage } from '@/lib/i18n';

/** Redirect profile tab to account screen */
export default function ProfileScreen() {
  const { t } = useLanguage();

  return (
    <Screen title={t('profile.title')} subtitle={t('profile.subtitle')} headerAccessory={<UserAvatar />}>
      {/* This screen now redirects to account modal */}
    </Screen>
  );
}
