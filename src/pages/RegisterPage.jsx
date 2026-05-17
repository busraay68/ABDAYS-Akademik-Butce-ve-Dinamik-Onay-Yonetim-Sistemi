import { ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

const initialForm = {
  fullName: '',
  department: '',
  email: '',
  password: '',
  confirmPassword: '',
  rememberMe: true,
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { isLoading, register } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [passwordPolicy, setPasswordPolicy] = useState(
    'Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.',
  );

  useEffect(() => {
    authService
      .fetchPasswordPolicy()
      .then((data) => setPasswordPolicy(data.message))
      .catch(() => undefined);
  }, []);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Şifre ve şifre tekrarı aynı olmalıdır.');
      return;
    }

    try {
      await register(
        {
          fullName: form.fullName,
          department: form.department,
          email: form.email,
          password: form.password,
        },
        form.rememberMe,
      );
      navigate('/dashboard', { replace: true });
    } catch (registerError) {
      setError(
        registerError.response?.data?.message ??
        registerError.message ??
        'Kayıt işlemi tamamlanamadı.',
      );
    } finally {
      // loading state is provided by AuthContext
    }
  };

  return (
    <div className="min-h-screen bg-page-radial px-4 py-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[36px] border border-white/60 bg-white/70 shadow-soft backdrop-blur xl:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-gradient-to-br from-ink to-tide p-10 text-white xl:flex xl:flex-col xl:justify-center">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-white/50">ABDAYS</p>
            <h1 className="mt-4 font-display text-4xl font-light leading-tight text-white/90">
              Akademik bütçe ve süreç <br /> yönetim platformu
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 md:p-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-[32px] border border-ink/10 bg-white p-8 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-tide/10 p-3 text-tide">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate">Araştırmacı kaydı</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                  Yeni hesap oluştur
                </h2>
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Ad soyad</span>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="focus-ring w-full rounded-2xl border border-ink/10 bg-mist px-4 py-3 text-sm"
                  placeholder="Ad Soyad"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Bölüm / birim</span>
                <input
                  type="text"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="focus-ring w-full rounded-2xl border border-ink/10 bg-mist px-4 py-3 text-sm"
                  placeholder="Örn. Bilgisayar Mühendisliği"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">E-posta</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="focus-ring w-full rounded-2xl border border-ink/10 bg-mist px-4 py-3 text-sm"
                  placeholder="ornek@universite.edu.tr"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Şifre</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="focus-ring w-full rounded-2xl border border-ink/10 bg-mist px-4 py-3 text-sm"
                  placeholder="Güçlü bir şifre oluşturun"
                />
                <span className="mt-2 block text-xs leading-5 text-slate">{passwordPolicy}</span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Şifre tekrarı</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="focus-ring w-full rounded-2xl border border-ink/10 bg-mist px-4 py-3 text-sm"
                  placeholder="Şifreyi tekrar girin"
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-slate">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                />
                Beni hatırla
              </label>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="focus-ring mt-8 w-full rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white"
            >
              {isLoading ? 'Kayıt oluşturuluyor...' : 'Kaydı tamamla'}
            </button>



            <p className="mt-5 text-center text-sm text-slate">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="font-semibold text-ink underline decoration-ink/20">
                Giriş yapın
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
