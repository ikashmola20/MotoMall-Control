'use client';

import { useAdminStore } from '@/lib/admin-store';
import { useState, useMemo } from 'react';
import { Order, OrderStatus } from '@/types/admin';
import { formatIQD, formatDate } from '@/lib/format';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import { Eye, Filter, ChevronDown, CheckSquare } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

const statusLabels: Record<string, string> = {
  processing: 'قيد المراجعة',
  confirmed: 'مؤكد',
  in_transit: 'في الطريق',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

const statusColors: Record<string, string> = {
  processing: 'bg-warning/10 text-warning',
  confirmed: 'bg-accent/10 text-accent',
  in_transit: 'bg-purple-400/10 text-purple-400',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
};

const statusFlow: OrderStatus[] = ['processing', 'confirmed', 'in_transit', 'delivered'];

const paymentLabels: Record<string, string> = {
  cod: 'الدفع عند الاستلام',
  bank_transfer: 'تحويل مصرفي',
  zaincash: 'ZainCash',
  qi: 'Qi Card',
  credit_card: 'بطاقة ائتمان',
};

export default function OrdersPage() {
  const { orders, updateOrderStatus } = useAdminStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const pageSize = 15;

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = o.orderNumber.includes(search) || o.customerName.includes(search);
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const safePage = Math.min(currentPage, totalPages || 1);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    const idx = statusFlow.indexOf(current);
    if (idx < statusFlow.length - 1) return statusFlow[idx + 1];
    return null;
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map(o => o.id)));
    }
  };

  const bulkStatusChange = (status: OrderStatus) => {
    selected.forEach(id => updateOrderStatus(id, status));
    setSelected(new Set());
  };

  const isAllSelected = paginated.length > 0 && selected.size === paginated.length;

  return (
    <>
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <SearchInput value={search} onChange={setSearch} placeholder="بحث برقم الطلب أو اسم العميل..." />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none bg-bg-secondary border border-border rounded-xl px-4 py-2.5 pl-8 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
            >
              <option value="all">جميع الحالات</option>
              <option value="processing">قيد المراجعة</option>
              <option value="confirmed">مؤكد</option>
              <option value="in_transit">في الطريق</option>
              <option value="delivered">تم التسليم</option>
              <option value="cancelled">ملغي</option>
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
          <span className="text-sm text-text-secondary">{filtered.length} طلب</span>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 animate-fade-in">
            <span className="text-sm text-accent font-medium">
              <CheckSquare className="w-4 h-4 inline ml-1" />
              {selected.size} طلب محدد
            </span>
            <div className="flex flex-wrap gap-2">
              {statusFlow.map(s => (
                <button
                  key={s}
                  onClick={() => bulkStatusChange(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusColors[s]} hover:opacity-80`}
                >
                  تحويل إلى {statusLabels[s]}
                </button>
              ))}
              <button
                onClick={() => { if (confirm(`إلغاء ${selected.size} طلب؟`)) bulkStatusChange('cancelled'); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
              >
                إلغاء الكل
              </button>
            </div>
            <button onClick={() => setSelected(new Set())} className="text-xs text-text-muted hover:text-text-secondary mr-auto">إلغاء التحديد</button>
          </div>
        )}

        <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/30">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded accent-accent"
                    />
                  </th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">رقم الطلب</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">العميل</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">المبلغ</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">الدفع</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">الحالة</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">التاريخ</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(order => (
                  <tr
                    key={order.id}
                    className={`border-b border-border/50 hover:bg-bg-secondary/30 transition-colors ${selected.has(order.id) ? 'bg-accent/5' : ''}`}
                  >
                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="w-4 h-4 rounded accent-accent"
                      />
                    </td>
                    <td
                      className="py-3 px-4 text-text-primary font-inter font-medium cursor-pointer"
                      onClick={() => { setSelectedOrder(order); setShowDetails(true); }}
                    >
                      {order.orderNumber}
                    </td>
                    <td
                      className="py-3 px-4 cursor-pointer"
                      onClick={() => { setSelectedOrder(order); setShowDetails(true); }}
                    >
                      <div>
                        <p className="text-text-primary">{order.customerName}</p>
                        <p className="text-xs text-text-muted font-inter">{order.customerPhone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-primary font-inter">{formatIQD(order.totalAmount)}</td>
                    <td className="py-3 px-4 text-text-secondary text-xs">{paymentLabels[order.paymentMethod]}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary font-inter text-xs">{formatDate(order.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedOrder(order); setShowDetails(true); }}
                          className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {getNextStatus(order.status) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-colors"
                            title={`تحويل إلى ${statusLabels[getNextStatus(order.status)!]}`}
                          >
                            <Filter className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <Modal isOpen={showDetails} onClose={() => setShowDetails(false)} title={`طلب ${selectedOrder?.orderNumber || ''}`} size="lg">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-secondary rounded-xl p-3">
                <p className="text-xs text-text-muted mb-1">العميل</p>
                <p className="text-sm text-text-primary font-medium">{selectedOrder.customerName}</p>
                <p className="text-xs text-text-secondary font-inter">{selectedOrder.customerPhone}</p>
              </div>
              <div className="bg-bg-secondary rounded-xl p-3">
                <p className="text-xs text-text-muted mb-1">عنوان الشحن</p>
                <p className="text-sm text-text-primary">{selectedOrder.shippingAddress}</p>
              </div>
              <div className="bg-bg-secondary rounded-xl p-3">
                <p className="text-xs text-text-muted mb-1">طريقة الدفع</p>
                <p className="text-sm text-text-primary">{paymentLabels[selectedOrder.paymentMethod]}</p>
              </div>
              <div className="bg-bg-secondary rounded-xl p-3">
                <p className="text-xs text-text-muted mb-1">الحالة</p>
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[selectedOrder.status]}`}>
                  {statusLabels[selectedOrder.status]}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-text-primary mb-2">المنتجات</h4>
              <div className="bg-bg-secondary rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-2 px-3 text-text-secondary font-medium">المنتج</th>
                      <th className="text-right py-2 px-3 text-text-secondary font-medium">الكمية</th>
                      <th className="text-right py-2 px-3 text-text-secondary font-medium">السعر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 px-3 text-text-primary">{item.productName}</td>
                        <td className="py-2 px-3 text-text-secondary font-inter">{item.quantity}</td>
                        <td className="py-2 px-3 text-text-primary font-inter">{formatIQD(item.price)}</td>
                      </tr>
                    ))}
                    <tr className="bg-bg-hover/30">
                      <td className="py-2 px-3 text-text-primary font-medium" colSpan={2}>الإجمالي</td>
                      <td className="py-2 px-3 text-accent font-bold font-inter">{formatIQD(selectedOrder.totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-text-primary mb-2">تحديث الحالة</h4>
              <div className="flex flex-wrap gap-2">
                {statusFlow.map(s => (
                  <button
                    key={s}
                    onClick={() => updateOrderStatus(selectedOrder.id, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      selectedOrder.status === s
                        ? statusColors[s] + ' ring-1 ring-current'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                    }`}
                  >
                    {statusLabels[s]}
                  </button>
                ))}
                {selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    className="px-3 py-1.5 rounded-lg text-xs bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="bg-bg-secondary rounded-xl p-3">
                <p className="text-xs text-text-muted mb-1">ملاحظات</p>
                <p className="text-sm text-text-primary">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
