// src/app/profile/page.tsx
'use client';

import { Header } from '@/components/Header/Header';
import { ProfileOverview } from '../../components/Profile/ProfileOverview';

export default function ProfilePage() {
  return (
    <div className="relative min-h-screen">
      {/* Epic background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-black to-cyan-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.2),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.15),transparent_70%)]" />
      </div>

      <Header />

      <main className="pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <ProfileOverview />
        </div>
      </main>
    </div>
  );
}