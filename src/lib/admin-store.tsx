'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AdminRole,
  AdminUser,
  Brand,
  Category,
  Comparison,
  Customer,
  DailySales,
  Expense,
  HeroBanner,
  Notification,
  Order,
  Product,
  ProfileRole,
  Review,
  SiteSettings,
  SpecTemplate,
} from '@/types/admin';
import {
  defaultSettings,
  mockAdmins,
  mockBrands,
  mockCategories,
  mockComparisons,
  mockCustomers,
  mockExpenses,
  mockHeroBanners,
  mockOrders,
  mockProducts,
  mockReviews,
  mockSpecTemplates,
} from '@/data/mock-admin';
import {
  assignTeamRoleByEmail,
  deleteBrand,
  deleteCategoryDoc,
  deleteComparisonDoc,
  deleteHeroBanner,
  deleteProduct,
  deleteReviewDoc,
  deleteSpecTemplateDoc,
  loadAdminState,
  loadAdminUser,
  saveBrand,
  saveCategory,
  saveComparison,
  saveHeroBanner,
  saveOrder,
  saveProduct,
  saveReview,
  saveSettings,
  saveSpecTemplate,
  updateTeamRole,
} from '@/lib/supabase/db';
import { hasSupabaseClientConfig } from '@/lib/supabase/config';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const SESSION_KEY = 'motomall_session';

interface AdminState {
  currentUser: AdminUser | null;
  orders: Order[];
  products: Product[];
  categories: Category[];
  brands: Brand[];
  customers: Customer[];
  reviews: Review[];
  comparisons: Comparison[];
  expenses: Expense[];
  settings: SiteSettings;
  notifications: Notification[];
  dailySales: DailySales[];
  specTemplates: SpecTemplate[];
  heroBanners: HeroBanner[];
  teamMembers: AdminUser[];
}

interface AdminActions {
  hydrated: boolean;
  loading: boolean;
  toast: { id: string; message: string; type: 'success' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  login: (email: string, password: string) => Promise<AdminUser | null>;
  logout: () => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addBrand: (brand: Brand) => void;
  updateBrand: (brand: Brand) => void;
  deleteBrand: (id: string) => void;
  updateReviewStatus: (reviewId: string, status: Review['status']) => void;
  deleteReview: (id: string) => void;
  addComparison: (comparison: Comparison) => void;
  updateComparison: (comparison: Comparison) => void;
  deleteComparison: (id: string) => void;
  toggleComparisonFeatured: (id: string) => void;
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  updateSettings: (settings: SiteSettings) => void;
  markNotificationRead: (id: string) => void;
  resetData: () => void;
  addSpecTemplate: (template: SpecTemplate) => void;
  updateSpecTemplate: (template: SpecTemplate) => void;
  deleteSpecTemplate: (id: string) => void;
  addHeroBanner: (banner: HeroBanner) => void;
  updateHeroBanner: (banner: HeroBanner) => void;
  deleteHeroBanner: (id: string) => void;
  updateTeamMemberRole: (userId: string, role: ProfileRole) => void;
  assignTeamMemberByEmail: (
    email: string,
    role: Exclude<ProfileRole, 'customer'>,
  ) => void;
}

type AdminContextType = AdminState & AdminActions;
const AdminContext = createContext<AdminContextType | null>(null);

function getMockDefaults(): AdminState {
  return {
    currentUser: null,
    orders: mockOrders,
    products: mockProducts,
    categories: mockCategories,
    brands: mockBrands,
    customers: mockCustomers,
    reviews: mockReviews,
    comparisons: mockComparisons,
    expenses: mockExpenses,
    settings: defaultSettings,
    notifications: [],
    dailySales: buildDailySales(mockOrders),
    specTemplates: mockSpecTemplates,
    heroBanners: mockHeroBanners,
    teamMembers: mockAdmins,
  };
}

function getEmptyDefaults(): AdminState {
  return {
    currentUser: null,
    orders: [],
    products: [],
    categories: [],
    brands: [],
    customers: [],
    reviews: [],
    comparisons: [],
    expenses: mockExpenses,
    settings: defaultSettings,
    notifications: [],
    dailySales: buildDailySales([]),
    specTemplates: [],
    heroBanners: [],
    teamMembers: [],
  };
}

function getSession(): AdminUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? (JSON.parse(session) as AdminUser) : null;
  } catch {
    return null;
  }
}

function getDisplayNameFromMetadata(
  metadata: Record<string, unknown> | undefined,
): string | null {
  if (!metadata) {
    return null;
  }

  if (typeof metadata.full_name === 'string' && metadata.full_name.trim()) {
    return metadata.full_name.trim();
  }

  const parts = [metadata.first_name, metadata.last_name].filter(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0,
  );

  return parts.length > 0 ? parts.join(' ') : null;
}

function buildDailySales(orders: Order[]): DailySales[] {
  const totals = new Map<string, DailySales>();

  for (const order of orders) {
    const source = order.placedAt || order.createdAt;
    const key = source.slice(0, 10);
    const entry = totals.get(key) ?? { date: key, orders: 0, revenue: 0 };

    if (order.status !== 'cancelled') {
      entry.orders += 1;
      entry.revenue += order.totalAmount;
    }

    totals.set(key, entry);
  }

  const days: DailySales[] = [];
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    days.push(totals.get(key) ?? { date: key, orders: 0, revenue: 0 });
  }

  return days;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>(getEmptyDefaults);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    id: string;
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const stateRef = useRef(state);
  const currentUserRef = useRef<AdminUser | null>(state.currentUser);

  useEffect(() => {
    stateRef.current = state;
    currentUserRef.current = state.currentUser;
  }, [state]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'error') => {
      const id = Date.now().toString();
      setToast({ id, message, type });
      setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  const buildRemoteState = useCallback(
    async (currentUser: AdminUser | null): Promise<AdminState> => {
      const snapshot = await loadAdminState();
      const expenses =
        stateRef.current.expenses.length > 0
          ? stateRef.current.expenses
          : mockExpenses;

      return {
        currentUser,
        ...snapshot,
        expenses,
        notifications: [],
        dailySales: buildDailySales(snapshot.orders),
      };
    },
    [],
  );

  const refreshRemoteState = useCallback(
    async (
      currentUser = currentUserRef.current,
      options?: { silent?: boolean; fallbackToMock?: boolean },
    ) => {
      try {
        const nextState = await buildRemoteState(currentUser);
        setState(nextState);
      } catch (error) {
        if (!options?.silent) {
          showToast(
            error instanceof Error
              ? error.message
              : 'تعذر تحميل بيانات لوحة التحكم.',
          );
        }

        if (options?.fallbackToMock) {
          const fallback = getMockDefaults();
          fallback.currentUser = currentUser;
          fallback.expenses = stateRef.current.expenses.length
            ? stateRef.current.expenses
            : mockExpenses;
          setState(fallback);
        }
      } finally {
        setHydrated(true);
        setLoading(false);
      }
    },
    [buildRemoteState, showToast],
  );

  const runMutation = useCallback(
    async (
      mutation: () => Promise<unknown>,
      errorPrefix: string,
      successMessage?: string,
    ) => {
      try {
        await mutation();
        await refreshRemoteState(currentUserRef.current, { silent: true });
        if (successMessage) {
          showToast(successMessage, 'success');
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'حدث خطأ غير متوقع.';
        showToast(`${errorPrefix}: ${message}`);
        await refreshRemoteState(currentUserRef.current, {
          silent: true,
          fallbackToMock: false,
        });
      }
    },
    [refreshRemoteState, showToast],
  );

  useEffect(() => {
    if (hasSupabaseClientConfig) {
      return;
    }

    const mock = getMockDefaults();
    mock.currentUser = getSession();
    setState(mock);
    setHydrated(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (hasSupabaseClientConfig || typeof window === 'undefined') {
      return;
    }

    if (state.currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(state.currentUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [state.currentUser]);

  useEffect(() => {
    if (!hasSupabaseClientConfig) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setHydrated(true);
      setLoading(false);
      return;
    }

    let active = true;

    const refresh = async (
      sessionUser?: {
        id: string;
        email?: string | null;
        user_metadata?: Record<string, unknown>;
      } | null,
    ) => {
      setLoading(true);

      const authUser = sessionUser ?? (await supabase.auth.getUser()).data.user ?? null;
      let adminUser: AdminUser | null = null;

      if (authUser) {
        adminUser = await loadAdminUser(
          authUser.id,
          authUser.email ?? null,
          getDisplayNameFromMetadata(authUser.user_metadata ?? undefined),
          typeof authUser.user_metadata?.avatar_url === 'string'
            ? authUser.user_metadata.avatar_url
            : null,
        );

        if (!adminUser) {
          await supabase.auth.signOut().catch(() => {});
        }
      }

      if (!active) {
        return;
      }

      await refreshRemoteState(adminUser, {
        silent: true,
        fallbackToMock: true,
      });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void refresh(session?.user ?? null);
    });

    void refresh();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshRemoteState]);

  const login = useCallback(
    async (email: string, password: string): Promise<AdminUser | null> => {
      const supabase = getSupabaseBrowserClient();

      if (!supabase || !hasSupabaseClientConfig) {
        const accounts: Record<string, { index: number; password: string }> = {
          '1': { index: 0, password: '1' },
          '2': { index: 1, password: '2' },
          '3': { index: 2, password: '3' },
        };
        const account = accounts[email];
        if (account && password === account.password && mockAdmins[account.index]) {
          const admin = mockAdmins[account.index];
          setState((previous) => ({ ...previous, currentUser: admin }));
          return admin;
        }
        return null;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error || !data.user) {
          return null;
        }

        const adminUser = await loadAdminUser(
          data.user.id,
          data.user.email ?? null,
          getDisplayNameFromMetadata(data.user.user_metadata ?? undefined),
          typeof data.user.user_metadata?.avatar_url === 'string'
            ? data.user.user_metadata.avatar_url
            : null,
        );

        if (!adminUser) {
          await supabase.auth.signOut().catch(() => {});
          return null;
        }

        setLoading(true);
        await refreshRemoteState(adminUser, {
          silent: true,
          fallbackToMock: true,
        });
        return adminUser;
      } catch {
        return null;
      }
    },
    [refreshRemoteState],
  );

  const logout = useCallback(() => {
    setState((previous) => ({ ...previous, currentUser: null }));
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  }, []);

  const updateOrderStatus = useCallback(
    (orderId: string, status: Order['status']) => {
      const order = stateRef.current.orders.find((item) => item.id === orderId);
      if (!order) {
        return;
      }

      const updatedOrder: Order = {
        ...order,
        status,
        updatedAt: new Date().toISOString(),
      };

      setState((previous) => ({
        ...previous,
        orders: previous.orders.map((item) =>
          item.id === orderId ? updatedOrder : item,
        ),
      }));

      void runMutation(
        () => saveOrder(updatedOrder),
        'فشل تحديث الطلب',
        'تم تحديث الطلب بنجاح',
      );
    },
    [runMutation],
  );

  const addProduct = useCallback(
    (product: Product) => {
      setState((previous) => ({
        ...previous,
        products: [product, ...previous.products],
      }));
      void runMutation(() => saveProduct(product), 'فشل حفظ المنتج');
    },
    [runMutation],
  );

  const updateProduct = useCallback(
    (product: Product) => {
      setState((previous) => ({
        ...previous,
        products: previous.products.map((item) =>
          item.id === product.id ? product : item,
        ),
      }));
      void runMutation(() => saveProduct(product), 'فشل تحديث المنتج');
    },
    [runMutation],
  );

  const deleteProductAction = useCallback(
    (id: string) => {
      setState((previous) => ({
        ...previous,
        products: previous.products.filter((item) => item.id !== id),
      }));
      void runMutation(() => deleteProduct(id), 'فشل حذف المنتج');
    },
    [runMutation],
  );

  const addCategory = useCallback(
    (category: Category) => {
      setState((previous) => ({
        ...previous,
        categories: [...previous.categories, category],
      }));
      void runMutation(() => saveCategory(category), 'فشل حفظ القسم');
    },
    [runMutation],
  );

  const updateCategory = useCallback(
    (category: Category) => {
      setState((previous) => ({
        ...previous,
        categories: previous.categories.map((item) =>
          item.id === category.id ? category : item,
        ),
      }));
      void runMutation(() => saveCategory(category), 'فشل تحديث القسم');
    },
    [runMutation],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      setState((previous) => ({
        ...previous,
        categories: previous.categories.filter((item) => item.id !== id),
      }));
      void runMutation(() => deleteCategoryDoc(id), 'فشل حذف القسم');
    },
    [runMutation],
  );

  const addBrand = useCallback(
    (brand: Brand) => {
      setState((previous) => ({
        ...previous,
        brands: [...previous.brands, brand],
      }));
      void runMutation(() => saveBrand(brand), 'فشل حفظ البراند');
    },
    [runMutation],
  );

  const updateBrand = useCallback(
    (brand: Brand) => {
      setState((previous) => ({
        ...previous,
        brands: previous.brands.map((item) =>
          item.id === brand.id ? brand : item,
        ),
      }));
      void runMutation(() => saveBrand(brand), 'فشل تحديث البراند');
    },
    [runMutation],
  );

  const deleteBrandAction = useCallback(
    (id: string) => {
      setState((previous) => ({
        ...previous,
        brands: previous.brands.filter((item) => item.id !== id),
      }));
      void runMutation(() => deleteBrand(id), 'فشل حذف البراند');
    },
    [runMutation],
  );

  const updateReviewStatus = useCallback(
    (reviewId: string, status: Review['status']) => {
      const review = stateRef.current.reviews.find((item) => item.id === reviewId);
      if (!review) {
        return;
      }

      const updatedReview: Review = {
        ...review,
        status,
        updatedAt: new Date().toISOString(),
      };

      setState((previous) => ({
        ...previous,
        reviews: previous.reviews.map((item) =>
          item.id === reviewId ? updatedReview : item,
        ),
      }));

      void runMutation(() => saveReview(updatedReview), 'فشل تحديث التقييم');
    },
    [runMutation],
  );

  const deleteReview = useCallback(
    (id: string) => {
      setState((previous) => ({
        ...previous,
        reviews: previous.reviews.filter((item) => item.id !== id),
      }));
      void runMutation(() => deleteReviewDoc(id), 'فشل حذف التقييم');
    },
    [runMutation],
  );

  const addComparison = useCallback(
    (comparison: Comparison) => {
      setState((previous) => ({
        ...previous,
        comparisons: [comparison, ...previous.comparisons],
      }));
      void runMutation(() => saveComparison(comparison), 'فشل حفظ المقارنة');
    },
    [runMutation],
  );

  const updateComparison = useCallback(
    (comparison: Comparison) => {
      setState((previous) => ({
        ...previous,
        comparisons: previous.comparisons.map((item) =>
          item.id === comparison.id ? comparison : item,
        ),
      }));
      void runMutation(() => saveComparison(comparison), 'فشل تحديث المقارنة');
    },
    [runMutation],
  );

  const deleteComparison = useCallback(
    (id: string) => {
      setState((previous) => ({
        ...previous,
        comparisons: previous.comparisons.filter((item) => item.id !== id),
      }));
      void runMutation(() => deleteComparisonDoc(id), 'فشل حذف المقارنة');
    },
    [runMutation],
  );

  const toggleComparisonFeatured = useCallback(
    (id: string) => {
      const comparison = stateRef.current.comparisons.find((item) => item.id === id);
      if (!comparison) {
        return;
      }

      const updatedComparison = {
        ...comparison,
        isFeatured: !comparison.isFeatured,
      };

      setState((previous) => ({
        ...previous,
        comparisons: previous.comparisons.map((item) =>
          item.id === id ? updatedComparison : item,
        ),
      }));

      void runMutation(
        () => saveComparison(updatedComparison),
        'فشل تحديث المقارنة',
      );
    },
    [runMutation],
  );

  const addExpense = useCallback((expense: Expense) => {
    setState((previous) => ({
      ...previous,
      expenses: [expense, ...previous.expenses],
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setState((previous) => ({
      ...previous,
      expenses: previous.expenses.filter((item) => item.id !== id),
    }));
  }, []);

  const updateSettings = useCallback(
    (settings: SiteSettings) => {
      setState((previous) => ({
        ...previous,
        settings,
      }));
      void runMutation(() => saveSettings(settings), 'فشل حفظ الإعدادات');
    },
    [runMutation],
  );

  const markNotificationRead = useCallback((id: string) => {
    setState((previous) => ({
      ...previous,
      notifications: previous.notifications.map((item) =>
        item.id === id ? { ...item, isRead: true } : item,
      ),
    }));
  }, []);

  const resetData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
    setState(getMockDefaults());
  }, []);

  const addSpecTemplate = useCallback(
    (template: SpecTemplate) => {
      setState((previous) => ({
        ...previous,
        specTemplates: [template, ...previous.specTemplates],
      }));
      void runMutation(() => saveSpecTemplate(template), 'فشل حفظ قالب المواصفات');
    },
    [runMutation],
  );

  const updateSpecTemplate = useCallback(
    (template: SpecTemplate) => {
      setState((previous) => ({
        ...previous,
        specTemplates: previous.specTemplates.map((item) =>
          item.id === template.id ? template : item,
        ),
      }));
      void runMutation(
        () => saveSpecTemplate(template),
        'فشل تحديث قالب المواصفات',
      );
    },
    [runMutation],
  );

  const deleteSpecTemplate = useCallback(
    (id: string) => {
      setState((previous) => ({
        ...previous,
        specTemplates: previous.specTemplates.filter((item) => item.id !== id),
      }));
      void runMutation(
        () => deleteSpecTemplateDoc(id),
        'فشل حذف قالب المواصفات',
      );
    },
    [runMutation],
  );

  const addHeroBanner = useCallback(
    (banner: HeroBanner) => {
      setState((previous) => ({
        ...previous,
        heroBanners: [...previous.heroBanners, banner],
      }));
      void runMutation(() => saveHeroBanner(banner), 'فشل حفظ البانر');
    },
    [runMutation],
  );

  const updateHeroBanner = useCallback(
    (banner: HeroBanner) => {
      setState((previous) => ({
        ...previous,
        heroBanners: previous.heroBanners.map((item) =>
          item.id === banner.id ? banner : item,
        ),
      }));
      void runMutation(() => saveHeroBanner(banner), 'فشل تحديث البانر');
    },
    [runMutation],
  );

  const deleteHeroBannerAction = useCallback(
    (id: string) => {
      setState((previous) => ({
        ...previous,
        heroBanners: previous.heroBanners.filter((item) => item.id !== id),
      }));
      void runMutation(() => deleteHeroBanner(id), 'فشل حذف البانر');
    },
    [runMutation],
  );

  const updateTeamMemberRole = useCallback(
    (userId: string, role: ProfileRole) => {
      if (stateRef.current.currentUser?.role !== 'admin') {
        showToast('إدارة صلاحيات الفريق متاحة للمدير فقط.');
        return;
      }

      const optimisticTeam =
        role === 'customer'
          ? stateRef.current.teamMembers.filter((item) => item.id !== userId)
          : stateRef.current.teamMembers.map((item) =>
              item.id === userId
                ? { ...item, role: role as AdminRole }
                : item,
            );

      setState((previous) => ({
        ...previous,
        teamMembers: optimisticTeam,
      }));

      void runMutation(
        () => updateTeamRole({ userId, role }),
        'فشل تحديث صلاحية العضو',
      );
    },
    [runMutation, showToast],
  );

  const assignTeamMemberByEmail = useCallback(
    (email: string, role: Exclude<ProfileRole, 'customer'>) => {
      if (stateRef.current.currentUser?.role !== 'admin') {
        showToast('إدارة صلاحيات الفريق متاحة للمدير فقط.');
        return;
      }

      void runMutation(
        () => assignTeamRoleByEmail(email, role),
        'فشل تعيين صلاحية العضو',
        'تم تحديث العضو بنجاح',
      );
    },
    [runMutation, showToast],
  );

  const value: AdminContextType = useMemo(
    () => ({
      ...state,
      hydrated,
      loading,
      toast,
      showToast,
      login,
      logout,
      updateOrderStatus,
      addProduct,
      updateProduct,
      deleteProduct: deleteProductAction,
      addCategory,
      updateCategory,
      deleteCategory,
      addBrand,
      updateBrand,
      deleteBrand: deleteBrandAction,
      updateReviewStatus,
      deleteReview,
      addComparison,
      updateComparison,
      deleteComparison,
      toggleComparisonFeatured,
      addExpense,
      deleteExpense,
      updateSettings,
      markNotificationRead,
      resetData,
      addSpecTemplate,
      updateSpecTemplate,
      deleteSpecTemplate,
      addHeroBanner,
      updateHeroBanner,
      deleteHeroBanner: deleteHeroBannerAction,
      updateTeamMemberRole,
      assignTeamMemberByEmail,
    }),
    [
      state,
      hydrated,
      loading,
      toast,
      showToast,
      login,
      logout,
      updateOrderStatus,
      addProduct,
      updateProduct,
      deleteProductAction,
      addCategory,
      updateCategory,
      deleteCategory,
      addBrand,
      updateBrand,
      deleteBrandAction,
      updateReviewStatus,
      deleteReview,
      addComparison,
      updateComparison,
      deleteComparison,
      toggleComparisonFeatured,
      addExpense,
      deleteExpense,
      updateSettings,
      markNotificationRead,
      resetData,
      addSpecTemplate,
      updateSpecTemplate,
      deleteSpecTemplate,
      addHeroBanner,
      updateHeroBanner,
      deleteHeroBannerAction,
      updateTeamMemberRole,
      assignTeamMemberByEmail,
    ],
  );

  return (
    <AdminContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg animate-fade-in"
          style={{
            backgroundColor: toast.type === 'error' ? '#1a0a0a' : '#0a1a0a',
            borderColor:
              toast.type === 'error'
                ? 'rgba(239,68,68,0.3)'
                : 'rgba(16,185,129,0.3)',
            color: toast.type === 'error' ? '#EF4444' : '#10B981',
            fontFamily: 'Cairo, sans-serif',
            fontSize: 14,
            maxWidth: 400,
          }}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-current opacity-50 transition-opacity hover:opacity-100"
            style={{
              fontSize: 16,
              lineHeight: 1,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              color: 'inherit',
            }}
          >
            ×
          </button>
        </div>
      )}
    </AdminContext.Provider>
  );
}

export function useAdminStore(): AdminContextType {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminStore must be used within AdminProvider');
  }
  return context;
}
