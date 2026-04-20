'use client';

import { useState, useMemo } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { Customer } from '@/types/admin';
import { formatIQD, formatDate } from '@/lib/format';
import SearchInput from '@/components/ui/SearchInput';
import Modal from '@/components/ui/Modal';
import { Eye, Phone, Mail, MapPin } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

export default function CustomersPage() {
  const { customers, orders, currentUser } = useAdminStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const isAdmin = currentUser?.role === 'admin';

  const filtered = useMemo(() => {
    return customers.filter(c =>
      c.name.includes(search) || c.email.includes(search) || c.phone.includes(search)
    );
  }, [customers, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const safePage = Math.min(currentPage, totalPages || 1);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getCustomerOrders = (customerId: string) => {
    return orders.filter(o => o.customerId === customerId);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="بحث بالاسم أو البريد أو الهاتف..." />
        </div>
        <span className="text-sm text-text-secondary">{filtered.length} عميل</span>
      </div>

      <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/30">
                <th className="text-right py-3 px-4 text-text-secondary font-medium">العميل</th>
                <th className="text-right py-3 px-4 text-text-secondary font-medium">الهاتف</th>
                <th className="text-right py-3 px-4 text-text-secondary font-medium">الطلبات</th>
                <th className="text-right py-3 px-4 text-text-secondary font-medium">إجمالي المشتريات</th>
                <th className="text-right py-3 px-4 text-text-secondary font-medium">تاريخ التسجيل</th>
                <th className="text-right py-3 px-4 text-text-secondary font-medium">الحالة</th>
                <th className="text-right py-3 px-4 text-text-secondary font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-bg-secondary/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center text-accent font-semibold text-sm">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-text-primary font-medium">{c.name}</p>
                        <p className="text-xs text-text-muted font-inter">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-text-secondary font-inter">{c.phone}</td>
                  <td className="py-3 px-4 text-text-primary font-inter">{c.ordersCount}</td>
                  <td className="py-3 px-4 text-text-primary font-inter">{formatIQD(c.totalSpent)}</td>
                  <td className="py-3 px-4 text-text-secondary font-inter text-xs">{formatDate(c.createdAt)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${c.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {c.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => { setSelected(c); setShowDetails(true); }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <Modal isOpen={showDetails} onClose={() => setShowDetails(false)} title={selected?.name || ''}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-secondary rounded-xl p-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-text-muted" />
                <div><p className="text-[10px] text-text-muted">البريد</p><p className="text-xs text-text-primary font-inter">{selected.email}</p></div>
              </div>
              <div className="bg-bg-secondary rounded-xl p-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-text-muted" />
                <div><p className="text-[10px] text-text-muted">الهاتف</p><p className="text-xs text-text-primary font-inter">{selected.phone}</p></div>
              </div>
              <div className="bg-bg-secondary rounded-xl p-3 flex items-center gap-2 col-span-2">
                <MapPin className="w-4 h-4 text-text-muted" />
                <div><p className="text-[10px] text-text-muted">العنوان</p><p className="text-xs text-text-primary">{selected.address || 'غير محدد'}</p></div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-text-primary mb-2">طلبات العميل</h4>
              <div className="space-y-2">
                {getCustomerOrders(selected.id).length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-4">لا توجد طلبات</p>
                ) : (
                  getCustomerOrders(selected.id).map(o => (
                    <div key={o.id} className="bg-bg-secondary rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text-primary font-inter">{o.orderNumber}</p>
                        <p className="text-xs text-text-muted">{formatDate(o.createdAt)}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-text-primary font-inter">{formatIQD(o.totalAmount)}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          o.status === 'delivered' ? 'bg-success/10 text-success' :
                          o.status === 'cancelled' ? 'bg-danger/10 text-danger' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {o.status === 'processing' ? 'قيد المراجعة' :
                           o.status === 'confirmed' ? 'مؤكد' :
                           o.status === 'in_transit' ? 'في الطريق' :
                           o.status === 'delivered' ? 'تم التسليم' : 'ملغي'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {!isAdmin && (
              <p className="text-xs text-text-muted text-center pt-2 border-t border-border">عرض فقط — صلاحيات التعديل للمدير فقط</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
