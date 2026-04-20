'use client';

import { useMemo, useState } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import type { AdminRole, AdminUser } from '@/types/admin';
import { formatDate } from '@/lib/format';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Edit3, Plus, Shield, UserCheck, UserX } from 'lucide-react';

export default function TeamPage() {
  const {
    currentUser,
    teamMembers,
    updateTeamMemberRole,
    assignTeamMemberByEmail,
    showToast,
  } = useAdminStore();
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({
    email: '',
    role: 'employee' as AdminRole,
  });

  const roleLabels: Record<AdminRole, string> = {
    admin: 'مدير النظام',
    employee: 'موظف',
  };
  const roleColors: Record<AdminRole, string> = {
    admin: 'bg-accent/10 text-accent',
    employee: 'bg-success/10 text-success',
  };

  const adminsCount = useMemo(
    () => teamMembers.filter((member) => member.role === 'admin').length,
    [teamMembers],
  );

  const openAdd = () => {
    setEditingMember(null);
    setForm({ email: '', role: 'employee' });
    setShowForm(true);
  };

  const openEdit = (member: AdminUser) => {
    setEditingMember(member);
    setForm({ email: member.email, role: member.role });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingMember) {
      updateTeamMemberRole(editingMember.id, form.role);
    } else if (form.email.trim()) {
      assignTeamMemberByEmail(form.email.trim(), form.role);
    } else {
      showToast('أدخل بريدًا إلكترونيًا صالحًا.');
      return;
    }

    setShowForm(false);
  };

  const canEditMember = (member: AdminUser) =>
    currentUser?.role === 'admin' && member.id !== currentUser.id;

  const canDemoteMember = (member: AdminUser) => {
    if (currentUser?.role !== 'admin' || member.id === currentUser.id) {
      return false;
    }

    return !(member.role === 'admin' && adminsCount <= 1);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" />
          إضافة عضو
        </Button>
        <span className="text-sm text-text-secondary">{teamMembers.length} عضو</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => (
          <div key={member.id} className="rounded-2xl border border-border bg-bg-card p-5">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold ${
                    member.role === 'admin'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-success/10 text-success'
                  }`}
                >
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{member.name}</p>
                  <p className="text-xs font-inter text-text-muted">{member.email}</p>
                </div>
              </div>
              <span
                className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ${roleColors[member.role]}`}
              >
                {member.role === 'admin' ? (
                  <Shield className="ml-1 h-3 w-3" />
                ) : (
                  <UserCheck className="ml-1 h-3 w-3" />
                )}
                {roleLabels[member.role]}
              </span>
            </div>

            <div className="border-t border-border pt-3">
              <div className="mb-3">
                <p className="text-xs text-text-muted">آخر نشاط</p>
                <p className="text-xs font-inter text-text-secondary">
                  {formatDate(member.lastLogin)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-lg bg-success/10 px-2 py-1 text-xs font-medium text-success">
                  نشط
                </span>
                <button
                  onClick={() => openEdit(member)}
                  disabled={!canEditMember(member)}
                  className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-warning/10 hover:text-warning disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => updateTeamMemberRole(member.id, 'customer')}
                  disabled={!canDemoteMember(member)}
                  className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <UserX className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingMember ? 'تعديل صلاحية العضو' : 'إضافة عضو جديد'}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">
              البريد الإلكتروني *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, email: event.target.value }))
              }
              disabled={Boolean(editingMember)}
              className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none disabled:opacity-60 font-inter"
              dir="ltr"
            />
            {!editingMember && (
              <p className="mt-1 text-xs text-text-muted">
                يجب أن يكون المستخدم قد أنشأ حسابه مسبقًا في المتجر.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-text-secondary">الدور</label>
            <select
              value={form.role}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  role: event.target.value as AdminRole,
                }))
              }
              className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="employee">موظف</option>
              <option value="admin">مدير النظام</option>
            </select>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!editingMember && !form.email.trim()}
            >
              {editingMember ? 'حفظ' : 'إضافة'}
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
