import { getUserContext } from '@/lib/data';
import Nav from '@/components/nav';
import HelpButtonWrapper from '@/components/help-button-wrapper';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getUserContext();

  return (
    <div className="flex min-h-screen">
      <Nav
        orgName={ctx.orgName}
        userName={ctx.profile?.full_name || ctx.user.email || ''}
        userRole={ctx.membership.role}
      />
      <main className="flex-1 ml-60 p-8">{children}</main>
      <HelpButtonWrapper />
    </div>
  );
}
