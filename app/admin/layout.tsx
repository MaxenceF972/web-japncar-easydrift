import { AdminNav } from '@/components/admin/AdminNav'
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="min-h-dvh bg-[var(--bg-primary)]">
        <AdminNav />
        <div className="pb-20">
          {children}
        </div>
      </div>
    </AdminAuthGuard>
  )
}
