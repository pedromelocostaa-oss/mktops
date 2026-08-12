'use client';

import { usePathname } from 'next/navigation';
import HelpButton from './help-button';

export default function HelpButtonWrapper() {
  const pathname = usePathname();
  return <HelpButton pathname={pathname} />;
}
