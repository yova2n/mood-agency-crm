import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden sunset-bg">
      {/* Halos sunset */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full pointer-events-none -z-10"
        style={{
          background: "radial-gradient(circle, rgba(255,138,61,0.35) 0%, rgba(255,87,34,0.2) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-rose-600/15 rounded-full blur-[160px] -z-10" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Mood */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-mood mb-5 glow-primary relative">
            <span className="text-white font-black text-2xl tracking-tight">m</span>
          </div>
          <h1 className="text-5xl display tracking-tight text-white">
            mood<span className="text-white/40 font-normal italic text-3xl ml-1">agency</span>
          </h1>
          <p className="text-sm text-white/50 mt-3 font-medium">CRM interne — Influence & Stratégie</p>
        </div>

        <div className="glass-strong rounded-3xl p-8 shadow-[var(--shadow-glass)]">
          <h2 className="text-2xl font-bold mb-1 tracking-tight">Connexion</h2>
          <p className="text-sm text-white/50 mb-6">Accède à ton espace équipe</p>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-white/30 mt-6 font-medium">
          © {new Date().getFullYear()} Mood Agency — Kainova Group
        </p>
      </div>
    </div>
  );
}
