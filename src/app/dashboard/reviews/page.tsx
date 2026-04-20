'use client';

import { useState, useMemo } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { formatDate } from '@/lib/format';
import SearchInput from '@/components/ui/SearchInput';
import { Star, CheckCircle, XCircle, Trash2, ChevronDown } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

export default function ReviewsPage() {
  const { reviews, updateReviewStatus, deleteReview } = useAdminStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    return reviews.filter(r => {
      const matchSearch = r.productName.includes(search) || r.customerName.includes(search);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchRating = ratingFilter === 'all' || r.rating === Number(ratingFilter);
      return matchSearch && matchStatus && matchRating;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reviews, search, statusFilter, ratingFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const safePage = Math.min(currentPage, totalPages || 1);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const pendingCount = reviews.filter(r => r.status === 'pending').length;

  const statusLabels: Record<string, string> = { pending: 'معلق', approved: 'موافق', rejected: 'مرفوض' };
  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-danger/10 text-danger',
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="بحث بالمنتج أو العميل..." />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none bg-bg-secondary border border-border rounded-xl px-4 py-2.5 pl-8 text-sm text-text-primary focus:outline-none focus:border-accent">
            <option value="all">جميع الحالات</option>
            <option value="pending">معلق ({pendingCount})</option>
            <option value="approved">موافق</option>
            <option value="rejected">مرفوض</option>
          </select>
          <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
            className="appearance-none bg-bg-secondary border border-border rounded-xl px-4 py-2.5 pl-8 text-sm text-text-primary focus:outline-none focus:border-accent">
            <option value="all">جميع التقييمات</option>
            {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} نجوم</option>)}
          </select>
          <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
        <span className="text-sm text-text-secondary">{filtered.length} تقييم</span>
      </div>

      <div className="space-y-3">
        {paginated.map(review => (
          <div key={review.id} className="bg-bg-card rounded-2xl border border-border p-4 hover:border-bg-hover transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent font-semibold text-sm shrink-0">
                  {review.customerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-text-primary">{review.customerName}</p>
                    <span className="text-xs text-text-muted">على</span>
                    <p className="text-sm text-accent">{review.productName}</p>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-warning fill-warning' : 'text-bg-secondary'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-text-secondary">{review.comment}</p>
                  <p className="text-xs text-text-muted mt-2 font-inter">{formatDate(review.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[review.status]}`}>
                  {statusLabels[review.status]}
                </span>
                {review.status === 'pending' && (
                  <div className="flex gap-1">
                    <button onClick={() => updateReviewStatus(review.id, 'approved')}
                      className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-colors" title="موافقة">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => updateReviewStatus(review.id, 'rejected')}
                      className="p-1.5 rounded-lg text-text-muted hover:text-warning hover:bg-warning/10 transition-colors" title="رفض">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <button onClick={() => { if (confirm('حذف التقييم؟')) deleteReview(review.id); }}
                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors" title="حذف">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
