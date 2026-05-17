import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });

  const from = location.state?.from ?? '/dashboard';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (loginError) {
      setError(
        loginError.response?.data?.message ??
          loginError.message ??
          'Giriş yapılamadı.',
      );
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
                <p className="text-xs uppercase tracking-[0.28em] text-slate">Güvenli giriş</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                  Oturum aç
                </h2>
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">E-posta</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="focus-ring w-full rounded-2xl border border-ink/10 bg-mist px-4 py-3 text-sm"
                  placeholder="ornek@universite.edu.tr"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Şifre</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  className="focus-ring w-full rounded-2xl border border-ink/10 bg-mist px-4 py-3 text-sm"
                  placeholder="••••••••"
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-slate">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      rememberMe: event.target.checked,
                    }))
                  }
                />
                Beni hatırla
              </label>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="focus-ring mt-8 w-full rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white"
            >
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </button>



            <p className="mt-5 text-center text-sm text-slate">
              Hesabınız yok mu?{' '}
              <Link to="/register" className="font-semibold text-ink underline decoration-ink/20">
                Araştırmacı kaydı oluşturun
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
