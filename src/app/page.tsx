'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminStore } from '@/lib/admin-store';
import { Lock, User, Eye, EyeOff, Bike, Mail } from 'lucide-react';
import { hasSupabaseClientConfig } from '@/lib/supabase/config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAdminStore();
  const isSupabase = hasSupabaseClientConfig;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const user = await login(email, password);
    if (user) {
      router.push('/dashboard');
    } else {
      setError('بيانات الدخول غير صحيحة');
    }
    setLoading(false);
  };

  const quickLogin = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
  };

  const quickAccounts = isSupabase
    ? [
        { email: 'admin@motomall.iq', password: 'admin123', role: 'مدير النظام', name: 'أحمد المالك', color: '#3B82F6' },
        { email: 'manager@motomall.iq', password: 'manager123', role: 'مدير', name: 'علي المدير', color: '#3B82F6' },
        { email: 'employee@motomall.iq', password: 'employee123', role: 'موظف', name: 'محمد الموظف', color: '#10B981' },
      ]
    : [
        { email: '1', password: '1', role: 'مدير النظام', name: 'أحمد المالك', color: '#3B82F6' },
        { email: '2', password: '2', role: 'مدير النظام', name: 'علي المدير', color: '#3B82F6' },
        { email: '3', password: '3', role: 'موظف', name: 'محمد الموظف', color: '#10B981' },
      ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0B0F1A' }}>
      <div className="w-full max-w-[420px] animate-fade-in">

        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center rounded-2xl mb-4"
            style={{ width: 64, height: 64, backgroundColor: 'rgba(59,130,246,0.1)' }}
          >
            <Bike className="text-blue-500" style={{ width: 32, height: 32 }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB', fontFamily: 'Cairo, sans-serif' }}>MotoMall</h1>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>لوحة التحكم الإدارية</p>
        </div>

        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: '#111827', borderColor: '#1F2937' }}
        >
          <h2
            className="text-xl font-semibold text-center mb-6"
            style={{ color: '#F9FAFB', fontFamily: 'Cairo, sans-serif' }}
          >
            تسجيل الدخول
          </h2>

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm mb-5"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm mb-2" style={{ color: '#9CA3AF' }}>
                {isSupabase ? 'البريد الإلكتروني' : 'رقم الحساب'}
              </label>
              <div className="relative" style={{ direction: 'ltr' }}>
                <div className="absolute top-0 bottom-0 flex items-center px-3" style={{ right: 0 }}>
                  {isSupabase ? <Mail style={{ width: 18, height: 18, color: '#6B7280' }} /> : <User style={{ width: 18, height: 18, color: '#6B7280' }} />}
                </div>
                <input
                  type={isSupabase ? 'email' : 'text'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={isSupabase ? 'admin@motomall.iq' : 'أدخل رقم الحساب'}
                  className="w-full rounded-xl py-3 text-sm outline-none"
                  style={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #1F2937',
                    color: '#F9FAFB',
                    paddingRight: 44,
                    paddingLeft: 16,
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'center',
                    letterSpacing: isSupabase ? 'normal' : '0.15em',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3B82F6'}
                  onBlur={e => e.target.style.borderColor = '#1F2937'}
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm mb-2" style={{ color: '#9CA3AF' }}>
                كلمة المرور
              </label>
              <div className="relative" style={{ direction: 'ltr' }}>
                <div className="absolute top-0 bottom-0 flex items-center px-3" style={{ right: 0 }}>
                  <Lock style={{ width: 18, height: 18, color: '#6B7280' }} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full rounded-xl py-3 text-sm outline-none"
                  style={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #1F2937',
                    color: '#F9FAFB',
                    paddingRight: 44,
                    paddingLeft: 44,
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'center',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3B82F6'}
                  onBlur={e => e.target.style.borderColor = '#1F2937'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-0 bottom-0 flex items-center px-3"
                  style={{ left: 0, color: '#6B7280' }}
                >
                  {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold rounded-xl py-3 text-sm transition-all"
              style={{
                backgroundColor: loading ? 'rgba(59,130,246,0.5)' : '#3B82F6',
                color: '#fff',
                fontFamily: 'Cairo, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#2563EB'; }}
              onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#3B82F6'; }}
            >
              {loading ? 'جاري الدخول...' : 'دخول'}
            </button>
          </form>
        </div>

        <div
          className="rounded-2xl border p-5 mt-5"
          style={{ backgroundColor: '#111827', borderColor: '#1F2937' }}
        >
          <p className="text-xs text-center mb-4" style={{ color: '#6B7280' }}>
            حسابات تجريبية — اضغط للدخول السريع
          </p>
          <div className="grid grid-cols-3 gap-3">
            {quickAccounts.map(item => (
              <button
                key={item.email}
                onClick={() => quickLogin(item.email, item.password)}
                className="rounded-xl p-3 text-center transition-all"
                style={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #1F2937',
                  direction: 'rtl',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#374151';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = item.color + '40';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1F2937';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#1F2937';
                }}
              >
                <div
                  className="mx-auto rounded-full flex items-center justify-center mb-2"
                  style={{
                    width: 36, height: 36,
                    backgroundColor: item.color + '15',
                  }}
                >
                  <span className="font-bold" style={{ color: item.color, fontFamily: 'Cairo, sans-serif', fontSize: 11 }}>
                    {item.name.charAt(0)}
                  </span>
                </div>
                <p className="font-semibold text-xs" style={{ color: item.color, fontFamily: 'Cairo, sans-serif' }}>
                  {item.role}
                </p>
                <p className="mt-0.5" style={{ color: '#6B7280', fontSize: 10 }}>
                  {item.name}
                </p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
