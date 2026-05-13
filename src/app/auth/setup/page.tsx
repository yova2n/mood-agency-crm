import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="min-h-svh w-full flex items-center justify-center p-6 bg-[#0a0608] text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold tracking-tight">Mood Agency</div>
          <div className="text-sm text-white/50 mt-1">
            Finalise ton accès au CRM
          </div>
        </div>
        <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
          <SetupForm />
        </div>
        <div className="text-center text-xs text-white/30 mt-6">
          © {new Date().getFullYear()} Mood Agency — Kainova Group
        </div>
      </div>
    </main>
  );
}
