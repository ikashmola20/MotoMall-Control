'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import type {
  Customer,
  CustomerCrmStatus,
  CustomerInteractionType,
  CustomerTaskPriority,
  CustomerTaskStatus,
} from '@/types/admin';
import { formatIQD, formatDate } from '@/lib/format';
import SearchInput from '@/components/ui/SearchInput';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Eye,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Star,
  StickyNote,
  Tags,
  Trash2,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

type CustomerTab = 'profile' | 'orders' | 'notes' | 'tasks' | 'interactions';

const CUSTOMER_TABS: Array<{
  value: CustomerTab;
  label: string;
  icon: LucideIcon;
}> = [
  { value: 'profile', label: 'الملف', icon: UserRound },
  { value: 'orders', label: 'الطلبات', icon: ClipboardList },
  { value: 'notes', label: 'الملاحظات', icon: StickyNote },
  { value: 'tasks', label: 'المهام', icon: CalendarClock },
  { value: 'interactions', label: 'سجل التواصل', icon: MessageCircle },
];

const CRM_STATUS_LABELS: Record<CustomerCrmStatus, string> = {
  new: 'جديد',
  active: 'نشط',
  vip: 'VIP',
  at_risk: 'يحتاج متابعة',
  inactive: 'غير نشط',
};

const TASK_STATUS_LABELS: Record<CustomerTaskStatus, string> = {
  open: 'مفتوحة',
  in_progress: 'قيد المتابعة',
  done: 'منجزة',
  cancelled: 'ملغاة',
};

const TASK_PRIORITY_LABELS: Record<CustomerTaskPriority, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

const INTERACTION_LABELS: Record<CustomerInteractionType, string> = {
  call: 'اتصال',
  whatsapp: 'واتساب',
  visit: 'زيارة',
  email: 'بريد',
  note: 'ملاحظة',
};

const statusClasses: Record<CustomerCrmStatus, string> = {
  new: 'bg-accent/10 text-accent',
  active: 'bg-success/10 text-success',
  vip: 'bg-warning/10 text-warning',
  at_risk: 'bg-danger/10 text-danger',
  inactive: 'bg-text-muted/10 text-text-muted',
};

function inputClass(extra = '') {
  return `w-full rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent ${extra}`;
}

function formatDateTime(value?: string): string {
  if (!value) {
    return 'غير محدد';
  }

  return `${formatDate(value)} ${new Date(value).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function toDateTimeLocal(value?: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

function isFollowUpDue(customer: Customer): boolean {
  return Boolean(
    customer.nextFollowUpAt &&
      new Date(customer.nextFollowUpAt).getTime() <= Date.now(),
  );
}

function buildCrmDraft(customer: Customer) {
  return {
    crmStatus: customer.crmStatus ?? 'new',
    assignedTo: customer.assignedTo ?? '',
    nextFollowUpAt: toDateTimeLocal(customer.nextFollowUpAt),
    internalRating: customer.internalRating ?? 0,
    isActive: customer.isActive,
  };
}

export default function CustomersPage() {
  const {
    customers,
    orders,
    currentUser,
    teamMembers,
    updateCustomerCrm,
    addCustomerNote,
    deleteCustomerNote,
    addCustomerTask,
    updateCustomerTask,
    deleteCustomerTask,
    addCustomerInteraction,
    deleteCustomerInteraction,
    addCustomerTag,
    removeCustomerTag,
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerCrmStatus>('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [followUpOnly, setFollowUpOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<CustomerTab>('profile');
  const [currentPage, setCurrentPage] = useState(1);
  const [crmDraft, setCrmDraft] = useState({
    crmStatus: 'new' as CustomerCrmStatus,
    assignedTo: '',
    nextFollowUpAt: '',
    internalRating: 0,
    isActive: true,
  });
  const [noteText, setNoteText] = useState('');
  const [tagName, setTagName] = useState('');
  const [taskDraft, setTaskDraft] = useState({
    title: '',
    description: '',
    dueAt: '',
    priority: 'medium' as CustomerTaskPriority,
    assignedTo: '',
  });
  const [interactionDraft, setInteractionDraft] = useState({
    type: 'call' as CustomerInteractionType,
    summary: '',
    occurredAt: toDateTimeLocal(new Date().toISOString()),
  });

  const pageSize = 15;
  const isAdmin = currentUser?.role === 'admin';
  const selected = useMemo(
    () => customers.find((customer) => customer.id === selectedId) ?? null,
    [customers, selectedId],
  );

  const allTags = useMemo(() => {
    const tags = new Map<string, NonNullable<Customer['tags']>[number]>();
    for (const customer of customers) {
      for (const tag of customer.tags ?? []) {
        tags.set(tag.id, tag);
      }
    }
    return [...tags.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [customers]);

  const staffOptions = useMemo(() => {
    const staff = new Map<string, string>();
    for (const member of teamMembers) {
      staff.set(member.id, member.name);
    }
    for (const customer of customers) {
      if (customer.assignedTo && customer.assignedName) {
        staff.set(customer.assignedTo, customer.assignedName);
      }
    }
    return [...staff.entries()].map(([id, name]) => ({ id, name }));
  }, [customers, teamMembers]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const text = [
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        ...(customer.tags ?? []).map((tag) => tag.name),
      ]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !normalizedSearch || text.includes(normalizedSearch);
      const matchesStatus =
        statusFilter === 'all' || (customer.crmStatus ?? 'new') === statusFilter;
      const matchesTag =
        tagFilter === 'all' ||
        (customer.tags ?? []).some((tag) => tag.id === tagFilter);
      const matchesAssigned =
        assignedFilter === 'all' ||
        (assignedFilter === 'unassigned' && !customer.assignedTo) ||
        customer.assignedTo === assignedFilter;
      const matchesFollowUp = !followUpOnly || isFollowUpDue(customer);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTag &&
        matchesAssigned &&
        matchesFollowUp
      );
    });
  }, [assignedFilter, customers, followUpOnly, search, statusFilter, tagFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: customers.length,
      vip: customers.filter((customer) => customer.crmStatus === 'vip').length,
      followUps: customers.filter(isFollowUpDue).length,
      tasksToday: customers.reduce(
        (total, customer) =>
          total +
          (customer.tasks ?? []).filter(
            (task) =>
              task.status !== 'done' &&
              task.status !== 'cancelled' &&
              task.dueAt?.slice(0, 10) === today,
          ).length,
        0,
      ),
    };
  }, [customers]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const safePage = Math.min(currentPage, totalPages || 1);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getCustomerOrders = (customerId: string) =>
    orders.filter((order) => order.customerId === customerId);

  const openCustomer = (customer: Customer) => {
    setSelectedId(customer.id);
    setCrmDraft(buildCrmDraft(customer));
    setActiveTab('profile');
    setShowDetails(true);
  };

  const saveProfile = () => {
    if (!selected) {
      return;
    }

    updateCustomerCrm(selected.id, {
      crmStatus: crmDraft.crmStatus,
      assignedTo: crmDraft.assignedTo || null,
      nextFollowUpAt: fromDateTimeLocal(crmDraft.nextFollowUpAt),
      internalRating: crmDraft.internalRating,
      isActive: crmDraft.isActive,
    });
  };

  const submitNote = () => {
    if (!selected || !noteText.trim()) {
      return;
    }

    addCustomerNote(selected.id, noteText);
    setNoteText('');
  };

  const submitTask = () => {
    if (!selected || !taskDraft.title.trim()) {
      return;
    }

    addCustomerTask(selected.id, {
      title: taskDraft.title,
      description: taskDraft.description,
      dueAt: fromDateTimeLocal(taskDraft.dueAt) ?? undefined,
      priority: taskDraft.priority,
      assignedTo: taskDraft.assignedTo || null,
    });
    setTaskDraft({
      title: '',
      description: '',
      dueAt: '',
      priority: 'medium',
      assignedTo: '',
    });
  };

  const submitInteraction = () => {
    if (!selected || !interactionDraft.summary.trim()) {
      return;
    }

    addCustomerInteraction(selected.id, {
      type: interactionDraft.type,
      summary: interactionDraft.summary,
      occurredAt: fromDateTimeLocal(interactionDraft.occurredAt) ?? undefined,
    });
    setInteractionDraft({
      type: 'call',
      summary: '',
      occurredAt: toDateTimeLocal(new Date().toISOString()),
    });
  };

  const submitTag = () => {
    if (!selected || !tagName.trim()) {
      return;
    }

    addCustomerTag(selected.id, tagName);
    setTagName('');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'إجمالي العملاء', value: stats.total, icon: UserRound },
          { label: 'عملاء VIP', value: stats.vip, icon: Star },
          { label: 'يحتاجون متابعة', value: stats.followUps, icon: CalendarClock },
          { label: 'مهام اليوم', value: stats.tasksToday, icon: ClipboardList },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-bg-card p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-text-secondary">{item.label}</span>
              <item.icon className="h-5 w-5 text-accent" />
            </div>
            <p className="font-inter text-2xl font-bold text-text-primary">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_160px_auto]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="بحث بالاسم أو البريد أو الهاتف أو الوسم..."
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | CustomerCrmStatus)
            }
            className={inputClass()}
          >
            <option value="all">كل الحالات</option>
            {Object.entries(CRM_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            className={inputClass()}
          >
            <option value="all">كل الوسوم</option>
            {allTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <select
            value={assignedFilter}
            onChange={(event) => setAssignedFilter(event.target.value)}
            className={inputClass()}
          >
            <option value="all">كل الموظفين</option>
            <option value="unassigned">غير معين</option>
            {staffOptions.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setFollowUpOnly((value) => !value)}
            className={`rounded-xl border px-4 py-2.5 text-sm transition-colors ${
              followUpOnly
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            متابعة فقط
          </button>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          {filtered.length} عميل مطابق للفلاتر
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/30">
                <th className="px-4 py-3 text-right font-medium text-text-secondary">
                  العميل
                </th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">
                  الهاتف
                </th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">
                  الطلبات
                </th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">
                  إجمالي الصرف
                </th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">
                  الحالة
                </th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">
                  الوسوم
                </th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">
                  آخر تواصل
                </th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">
                  المتابعة القادمة
                </th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-border/50 transition-colors hover:bg-bg-secondary/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{customer.name}</p>
                        <p className="font-inter text-xs text-text-muted">
                          {customer.email || 'بدون بريد'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-inter text-text-secondary">
                    {customer.phone || '-'}
                  </td>
                  <td className="px-4 py-3 font-inter text-text-primary">
                    {customer.ordersCount}
                  </td>
                  <td className="px-4 py-3 font-inter text-text-primary">
                    {formatIQD(customer.totalSpent)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ${
                        statusClasses[customer.crmStatus ?? 'new']
                      }`}
                    >
                      {CRM_STATUS_LABELS[customer.crmStatus ?? 'new']}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[180px] flex-wrap gap-1">
                      {(customer.tags ?? []).slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full px-2 py-0.5 text-[11px] text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {(customer.tags?.length ?? 0) === 0 && (
                        <span className="text-xs text-text-muted">بدون وسوم</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-inter text-xs text-text-secondary">
                    {customer.lastContactAt ? formatDate(customer.lastContactAt) : '-'}
                  </td>
                  <td
                    className={`px-4 py-3 font-inter text-xs ${
                      isFollowUpDue(customer) ? 'text-danger' : 'text-text-secondary'
                    }`}
                  >
                    {customer.nextFollowUpAt
                      ? formatDate(customer.nextFollowUpAt)
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openCustomer(customer)}
                      className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-accent/10 hover:text-accent"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-text-muted"
                  >
                    لا توجد نتائج مطابقة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={selected?.name || 'تفاصيل العميل'}
        size="xl"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 border-b border-border pb-3">
              {CUSTOMER_TABS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value as string}
                  onClick={() => setActiveTab(value)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                    activeTab === value
                      ? 'bg-accent text-white'
                      : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'profile' && (
              <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoCard icon={Mail} label="البريد" value={selected.email || 'غير محدد'} />
                    <InfoCard icon={Phone} label="الهاتف" value={selected.phone || 'غير محدد'} />
                    <InfoCard
                      icon={MapPin}
                      label="العنوان"
                      value={selected.address || 'غير محدد'}
                      className="sm:col-span-2"
                    />
                  </div>

                  <div className="rounded-2xl border border-border bg-bg-secondary/40 p-4">
                    <div className="mb-3 flex items-center gap-2 text-text-primary">
                      <Tags className="h-4 w-4 text-accent" />
                      <h4 className="text-sm font-semibold">وسوم العميل</h4>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {(selected.tags ?? []).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                          {isAdmin && (
                            <button
                              onClick={() => removeCustomerTag(selected.id, tag.id)}
                              className="text-white/80 hover:text-white"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                      {(selected.tags?.length ?? 0) === 0 && (
                        <span className="text-sm text-text-muted">لا توجد وسوم بعد.</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={tagName}
                        onChange={(event) => setTagName(event.target.value)}
                        className={inputClass()}
                        placeholder="مثلاً: مهتم بالدراجات الكهربائية"
                      />
                      <button
                        onClick={submitTag}
                        className="rounded-xl bg-accent px-4 text-sm font-medium text-white"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-bg-secondary/40 p-4">
                  <h4 className="mb-4 text-sm font-semibold text-text-primary">
                    إدارة حالة CRM
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs text-text-muted">حالة العميل</span>
                      <select
                        value={crmDraft.crmStatus}
                        onChange={(event) =>
                          setCrmDraft((draft) => ({
                            ...draft,
                            crmStatus: event.target.value as CustomerCrmStatus,
                          }))
                        }
                        className={inputClass()}
                      >
                        {Object.entries(CRM_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-text-muted">التقييم الداخلي</span>
                      <select
                        value={crmDraft.internalRating}
                        onChange={(event) =>
                          setCrmDraft((draft) => ({
                            ...draft,
                            internalRating: Number(event.target.value),
                          }))
                        }
                        className={inputClass()}
                      >
                        {[0, 1, 2, 3, 4, 5].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating === 0 ? 'بدون تقييم' : `${rating} / 5`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-text-muted">الموظف المسؤول</span>
                      <select
                        value={crmDraft.assignedTo}
                        onChange={(event) =>
                          setCrmDraft((draft) => ({
                            ...draft,
                            assignedTo: event.target.value,
                          }))
                        }
                        className={inputClass()}
                      >
                        <option value="">غير معين</option>
                        {staffOptions.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-text-muted">المتابعة القادمة</span>
                      <input
                        type="datetime-local"
                        value={crmDraft.nextFollowUpAt}
                        onChange={(event) =>
                          setCrmDraft((draft) => ({
                            ...draft,
                            nextFollowUpAt: event.target.value,
                          }))
                        }
                        className={inputClass()}
                      />
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border border-border bg-bg-card px-3 py-2 text-sm text-text-primary">
                      <input
                        type="checkbox"
                        checked={crmDraft.isActive}
                        onChange={(event) =>
                          setCrmDraft((draft) => ({
                            ...draft,
                            isActive: event.target.checked,
                          }))
                        }
                      />
                      العميل نشط
                    </label>
                  </div>
                  <button
                    onClick={saveProfile}
                    className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                  >
                    حفظ بيانات CRM
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-2">
                {getCustomerOrders(selected.id).length === 0 ? (
                  <EmptyState text="لا توجد طلبات لهذا العميل." />
                ) : (
                  getCustomerOrders(selected.id).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-xl bg-bg-secondary p-3"
                    >
                      <div>
                        <p className="font-inter text-sm text-text-primary">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-text-muted">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-inter text-sm text-text-primary">
                          {formatIQD(order.totalAmount)}
                        </p>
                        <span className="rounded bg-warning/10 px-2 py-0.5 text-xs text-warning">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-bg-secondary/40 p-4">
                  <textarea
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    className={inputClass('min-h-24 resize-none')}
                    placeholder="اكتب ملاحظة داخلية عن العميل..."
                  />
                  <button
                    onClick={submitNote}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة ملاحظة
                  </button>
                </div>
                {(selected.notes ?? []).length === 0 ? (
                  <EmptyState text="لا توجد ملاحظات بعد." />
                ) : (
                  selected.notes?.map((note) => (
                    <CrmCard key={note.id}>
                      <div>
                        <p className="text-sm leading-6 text-text-primary">{note.body}</p>
                        <p className="mt-2 text-xs text-text-muted">
                          {note.authorName || 'MotoMall'} • {formatDateTime(note.createdAt)}
                        </p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => deleteCustomerNote(selected.id, note.id)}
                          className="text-text-muted hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </CrmCard>
                  ))
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="grid gap-3 rounded-2xl border border-border bg-bg-secondary/40 p-4 md:grid-cols-2">
                  <input
                    value={taskDraft.title}
                    onChange={(event) =>
                      setTaskDraft((draft) => ({ ...draft, title: event.target.value }))
                    }
                    className={inputClass()}
                    placeholder="عنوان مهمة المتابعة"
                  />
                  <input
                    type="datetime-local"
                    value={taskDraft.dueAt}
                    onChange={(event) =>
                      setTaskDraft((draft) => ({ ...draft, dueAt: event.target.value }))
                    }
                    className={inputClass()}
                  />
                  <select
                    value={taskDraft.priority}
                    onChange={(event) =>
                      setTaskDraft((draft) => ({
                        ...draft,
                        priority: event.target.value as CustomerTaskPriority,
                      }))
                    }
                    className={inputClass()}
                  >
                    {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={taskDraft.assignedTo}
                    onChange={(event) =>
                      setTaskDraft((draft) => ({
                        ...draft,
                        assignedTo: event.target.value,
                      }))
                    }
                    className={inputClass()}
                  >
                    <option value="">بدون مسؤول</option>
                    {staffOptions.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={taskDraft.description}
                    onChange={(event) =>
                      setTaskDraft((draft) => ({
                        ...draft,
                        description: event.target.value,
                      }))
                    }
                    className={inputClass('min-h-20 resize-none md:col-span-2')}
                    placeholder="تفاصيل المهمة..."
                  />
                  <button
                    onClick={submitTask}
                    className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white md:w-fit"
                  >
                    إضافة مهمة
                  </button>
                </div>

                {(selected.tasks ?? []).length === 0 ? (
                  <EmptyState text="لا توجد مهام متابعة." />
                ) : (
                  selected.tasks?.map((task) => (
                    <CrmCard key={task.id}>
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <p className="font-medium text-text-primary">{task.title}</p>
                          <span className="rounded-lg bg-bg-card px-2 py-1 text-xs text-text-secondary">
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </span>
                          <span className="rounded-lg bg-accent/10 px-2 py-1 text-xs text-accent">
                            {TASK_STATUS_LABELS[task.status]}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-text-secondary">{task.description}</p>
                        )}
                        <p className="mt-2 text-xs text-text-muted">
                          الاستحقاق: {formatDateTime(task.dueAt)} • المسؤول:{' '}
                          {task.assignedName || 'غير محدد'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status !== 'done' && (
                          <button
                            onClick={() =>
                              updateCustomerTask(selected.id, task.id, {
                                status: 'done',
                              })
                            }
                            className="rounded-lg bg-success/10 p-2 text-success"
                            title="إنجاز"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => deleteCustomerTask(selected.id, task.id)}
                            className="rounded-lg bg-danger/10 p-2 text-danger"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </CrmCard>
                  ))
                )}
              </div>
            )}

            {activeTab === 'interactions' && (
              <div className="space-y-4">
                <div className="grid gap-3 rounded-2xl border border-border bg-bg-secondary/40 p-4 md:grid-cols-[160px_220px_1fr_auto]">
                  <select
                    value={interactionDraft.type}
                    onChange={(event) =>
                      setInteractionDraft((draft) => ({
                        ...draft,
                        type: event.target.value as CustomerInteractionType,
                      }))
                    }
                    className={inputClass()}
                  >
                    {Object.entries(INTERACTION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    value={interactionDraft.occurredAt}
                    onChange={(event) =>
                      setInteractionDraft((draft) => ({
                        ...draft,
                        occurredAt: event.target.value,
                      }))
                    }
                    className={inputClass()}
                  />
                  <input
                    value={interactionDraft.summary}
                    onChange={(event) =>
                      setInteractionDraft((draft) => ({
                        ...draft,
                        summary: event.target.value,
                      }))
                    }
                    className={inputClass()}
                    placeholder="ملخص التواصل الداخلي..."
                  />
                  <button
                    onClick={submitInteraction}
                    className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
                  >
                    تسجيل
                  </button>
                </div>
                {(selected.interactions ?? []).length === 0 ? (
                  <EmptyState text="لا يوجد سجل تواصل بعد." />
                ) : (
                  selected.interactions?.map((interaction) => (
                    <CrmCard key={interaction.id}>
                      <div>
                        <p className="text-sm text-text-primary">
                          <span className="font-medium">
                            {INTERACTION_LABELS[interaction.type]}
                          </span>{' '}
                          — {interaction.summary}
                        </p>
                        <p className="mt-2 text-xs text-text-muted">
                          {interaction.createdByName || 'MotoMall'} •{' '}
                          {formatDateTime(interaction.occurredAt)}
                        </p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() =>
                            deleteCustomerInteraction(selected.id, interaction.id)
                          }
                          className="text-text-muted hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </CrmCard>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  className = '',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl bg-bg-secondary p-3 ${className}`}
    >
      <Icon className="h-4 w-4 text-text-muted" />
      <div>
        <p className="text-[10px] text-text-muted">{label}</p>
        <p className="text-sm text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-bg-secondary/30 p-8 text-center text-sm text-text-muted">
      {text}
    </div>
  );
}

function CrmCard({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-bg-secondary/40 p-4">
      {children}
    </div>
  );
}
