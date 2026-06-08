import { Heart, Sparkles } from 'lucide-react';
import { useAuthForm } from '../hooks/useAuthForm';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';

export default function Auth() {
  const { isSignUp, setIsSignUp, email, setEmail, password, setPassword, loading, error, message, handleSubmit } = useAuthForm();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background floating hearts */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <span className="absolute top-[8%]  left-[10%] text-4xl text-pink-200/40 animate-floatSlow" style={{ animationDelay: '0s' }}>♥</span>
        <span className="absolute top-[18%] right-[12%] text-2xl text-rose-200/30 animate-float" style={{ animationDelay: '0.8s' }}>♥</span>
        <span className="absolute top-[55%] left-[6%]  text-xl text-pink-200/35 animate-float" style={{ animationDelay: '1.4s' }}>✿</span>
        <span className="absolute top-[40%] right-[8%]  text-3xl text-pink-200/25 animate-floatSlow" style={{ animationDelay: '2s' }}>♥</span>
        <span className="absolute bottom-[15%] left-[20%] text-2xl text-rose-200/30 animate-float" style={{ animationDelay: '0.4s' }}>✦</span>
        <span className="absolute bottom-[25%] right-[15%] text-xl text-pink-200/40 animate-float" style={{ animationDelay: '1.7s' }}>♥</span>
        <span className="absolute top-[70%] left-[55%] text-sm text-rose-200/30 animate-twinkle" style={{ animationDelay: '0.9s' }}>✿</span>
        <span className="absolute top-[30%] left-[45%] text-sm text-pink-200/25 animate-twinkle" style={{ animationDelay: '1.3s' }}>♥</span>
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8 animate-bounceIn">
          <div
            className="inline-flex items-center justify-center w-18 h-18 w-[72px] h-[72px] rounded-3xl shadow-2xl mb-5 animate-pulsePink"
            style={{ background: 'linear-gradient(135deg, #f472b6, #fb7185)' }}
          >
            <Heart size={32} className="text-white fill-white animate-heartbeat" />
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-1"
            style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Memora
          </h1>
          <p className="text-gray-400 mt-1.5 text-sm font-semibold">Your precious memories, beautifully kept ✨</p>
        </div>

        <GlassCard className="p-8 animate-slideUp delay-150">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={16} className="text-pink-400 animate-sparkle" />
            <h2 className="text-base font-black text-gray-700">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="animate-slideUp delay-200">
              <label className="block text-sm font-bold text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl text-gray-800 placeholder-gray-300 text-sm font-medium transition-all"
                style={{
                  background: 'rgba(255,245,248,0.80)',
                  border: '1.5px solid rgba(255,168,210,0.50)',
                  outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(244,114,182,0.70)'; e.target.style.boxShadow = '0 0 0 3px rgba(244,114,182,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,168,210,0.50)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div className="animate-slideUp delay-300">
              <label className="block text-sm font-bold text-gray-600 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl text-gray-800 placeholder-gray-300 text-sm font-medium transition-all"
                style={{
                  background: 'rgba(255,245,248,0.80)',
                  border: '1.5px solid rgba(255,168,210,0.50)',
                  outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(244,114,182,0.70)'; e.target.style.boxShadow = '0 0 0 3px rgba(244,114,182,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,168,210,0.50)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm font-semibold animate-slideUp">
                {error}
              </div>
            )}
            {message && (
              <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm font-semibold animate-slideUp">
                {message}
              </div>
            )}

            <Button type="submit" disabled={loading} size="lg" className="w-full mt-2 animate-slideUp delay-400">
              {loading ? '✨ Please wait...' : isSignUp ? '💕 Create Account' : '♥ Sign In'}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-400 hover:text-pink-500 transition-colors font-semibold"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </GlassCard>

        <p className="text-center text-xs text-pink-300 mt-6 font-bold animate-slideUp delay-500">
          Made with love, just for you ♥
        </p>
      </div>
    </div>
  );
}
