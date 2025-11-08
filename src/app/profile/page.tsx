"use client"

import { Header } from "@/components/Header/Header"
import { ProfileOverview } from "../../components/Profile/ProfileOverview"

export default function ProfilePage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--background)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(100,116,139,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(71,85,105,0.08),transparent_70%)]" />
      </div>

      <Header />

      <main className="pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <ProfileOverview />
        </div>
      </main>
    </div>
  )
}
