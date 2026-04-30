"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarEventDialog } from "@/components/calendar/calendar-event-dialog";
import { MONTHS_FR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Brand, CalendarEvent, Collaboration, EventType, Influencer } from "@/lib/database.types";

const EVENT_COLORS: Record<EventType, { bg: string; text: string; border: string }> = {
  publication: { bg: "bg-orange-500/20", text: "text-orange-200", border: "border-orange-500/40" },
  campagne: { bg: "bg-rose-500/20", text: "text-rose-200", border: "border-rose-500/40" },
  deadline: { bg: "bg-amber-500/20", text: "text-amber-200", border: "border-amber-500/40" },
  reunion: { bg: "bg-emerald-500/20", text: "text-emerald-200", border: "border-emerald-500/40" },
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function CalendarView({
  initialEvents,
  collaborations,
  influencers,
  brands,
}: {
  initialEvents: CalendarEvent[];
  collaborations: Collaboration[];
  influencers: Influencer[];
  brands: Brand[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | null>(null);

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // Combine events + auto-generated events from collabs publication_date
  const allEvents: CalendarEvent[] = useMemo(() => {
    const auto: CalendarEvent[] = collaborations
      .filter((c) => c.publication_date)
      .map((c) => ({
        id: `auto-${c.id}`,
        title: c.title,
        type: c.step_publie ? ("publication" as EventType) : ("campagne" as EventType),
        influencer_id: c.influencer_id,
        collaboration_id: c.id,
        brand_id: c.brand_id,
        start_date: c.publication_date! + "T12:00:00Z",
        end_date: null,
        color: c.step_publie ? "#ff5722" : "#f43f5e",
        notes: null,
        created_at: c.created_at,
      }));
    return [...initialEvents, ...auto];
  }, [initialEvents, collaborations]);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  function eventsForDate(date: Date) {
    const ymd = ymdString(date);
    return allEvents.filter((e) => e.start_date.slice(0, 10) === ymd);
  }

  function nav(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m); setViewYear(y);
  }

  const upcoming = useMemo(() => {
    const todayStr = ymdString(today);
    return allEvents
      .filter((e) => e.start_date.slice(0, 10) >= todayStr)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 8);
  }, [allEvents, today]);

  const influencerMap = new Map(influencers.map((i) => [i.id, i]));
  const brandMap = new Map(brands.map((b) => [b.id, b]));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-4">
        {/* Header navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => nav(-1)} className="p-2 rounded-full glass glass-hover" aria-label="Mois précédent">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => nav(1)} className="p-2 rounded-full glass glass-hover" aria-label="Mois suivant">
              <ChevronRight className="w-4 h-4" />
            </button>
            <h2 className="text-2xl font-extrabold tracking-tight ml-2">
              {MONTHS_FR[viewMonth]} <span className="text-white/50 font-normal">{viewYear}</span>
            </h2>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}>
              Aujourd&apos;hui
            </Button>
            <Button size="sm" onClick={() => { setEditing(null); setDefaultDate(null); setOpen(true); }}>
              <Plus className="w-4 h-4" /> Événement
            </Button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="glass rounded-3xl p-3 overflow-hidden">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[11px] uppercase tracking-widest text-white/40 font-bold py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((day, i) => {
              const events = eventsForDate(day.date);
              const isToday = ymdString(day.date) === ymdString(today);
              return (
                <motion.button
                  key={i}
                  onClick={() => { setEditing(null); setDefaultDate(ymdString(day.date)); setOpen(true); }}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "aspect-square min-h-[80px] rounded-xl p-2 text-left flex flex-col gap-1 transition-all relative overflow-hidden",
                    day.inMonth ? "bg-white/[0.03] hover:bg-white/[0.07]" : "bg-transparent text-white/20",
                    isToday && "ring-2 ring-orange-500 ring-offset-2 ring-offset-[#1c1815]"
                  )}
                >
                  <span className={cn("text-xs font-bold", isToday && "gradient-text text-base")}>
                    {day.date.getDate()}
                  </span>
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {events.slice(0, 3).map((e) => {
                      const colors = EVENT_COLORS[e.type];
                      return (
                        <div
                          key={e.id}
                          className={cn("text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium border", colors.bg, colors.text, colors.border)}
                          title={e.title}
                        >
                          {e.title}
                        </div>
                      );
                    })}
                    {events.length > 3 && (
                      <div className="text-[10px] text-white/50 px-1">+{events.length - 3}</div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Légende */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(EVENT_COLORS) as EventType[]).map((t) => {
            const c = EVENT_COLORS[t];
            return (
              <Badge key={t} className={cn("border", c.bg, c.text, c.border)}>
                {t === "publication" ? "Publication" : t === "campagne" ? "Campagne" : t === "deadline" ? "Deadline" : "Réunion"}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Sidebar — événements à venir */}
      <div className="space-y-4">
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-orange-300" />
            <h3 className="font-bold tracking-tight">À venir</h3>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-white/40 py-4 text-center">Aucun événement à venir.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((e) => {
                const colors = EVENT_COLORS[e.type];
                const date = new Date(e.start_date);
                const inf = e.influencer_id ? influencerMap.get(e.influencer_id) : null;
                const brand = e.brand_id ? brandMap.get(e.brand_id) : null;
                const isAuto = e.id.startsWith("auto-");
                return (
                  <div
                    key={e.id}
                    onClick={() => {
                      if (isAuto) return;
                      setEditing(e); setDefaultDate(null); setOpen(true);
                    }}
                    className={cn(
                      "p-3 rounded-2xl bg-white/[0.02] border border-white/5",
                      !isAuto && "cursor-pointer hover:bg-white/[0.05]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-center shrink-0 w-12">
                        <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold">
                          {date.toLocaleDateString("fr-FR", { month: "short" })}
                        </div>
                        <div className={cn("text-2xl font-black gradient-text leading-none mt-0.5")}>
                          {date.getDate()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <Badge className={cn("border text-[10px]", colors.bg, colors.text, colors.border)}>
                            {e.type}
                          </Badge>
                        </div>
                        <div className="font-semibold text-sm truncate">{e.title}</div>
                        <div className="text-xs text-white/50 truncate mt-0.5">
                          {[brand?.name, inf?.name].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass rounded-3xl p-5">
          <h3 className="font-bold tracking-tight mb-3">💡 Astuce</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Les <span className="text-orange-300 font-semibold">campagnes en cours</span> avec une date de publication apparaissent automatiquement.
            Clique sur une case du calendrier pour ajouter un événement à cette date.
          </p>
        </div>
      </div>

      <CalendarEventDialog
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setDefaultDate(null); } }}
        event={editing}
        defaultDate={defaultDate}
        influencers={influencers}
        brands={brands}
        collaborations={collaborations}
      />
    </div>
  );
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = (first.getDay() + 6) % 7; // Mon = 0
  const daysInMonth = last.getDate();

  const days: { date: Date; inMonth: boolean }[] = [];

  // Previous month padding
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, inMonth: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(year, month, d), inMonth: true });
  }
  // Pad to 42
  while (days.length < 42) {
    const last = days[days.length - 1].date;
    days.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }
  return days;
}

function ymdString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
