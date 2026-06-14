"use client";

import { formatNumber, formatPercent } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/influencer-status";
import type { Influencer } from "@/lib/database.types";

export function CataloguePrint({
  title,
  subtitle,
  influencers,
}: {
  title: string;
  subtitle: string;
  influencers: Influencer[];
}) {
  const totalFollowers = influencers.reduce(
    (sum, i) =>
      sum +
      (i.instagram_followers || 0) +
      (i.tiktok_followers || 0) +
      (i.youtube_subscribers || 0),
    0
  );

  return (
    <div className="catalogue-print">
      <style>{`
        @media screen {
          .catalogue-print { display: none; }
        }
        @media print {
          @page { size: A4; margin: 0; }
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .catalogue-print, .catalogue-print * { visibility: visible !important; }
          .catalogue-print {
            position: absolute; top: 0; left: 0; right: 0;
            background: #fff; color: #1a1a1a;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* COUVERTURE */}
      <section className="cat-cover">
        <div className="cat-cover-mark">M</div>
        <div className="cat-cover-brand">Mood Agency</div>
        <div className="cat-cover-tagline">Influence · Stratégie · Production</div>

        <div className="cat-cover-center">
          <h1 className="cat-cover-title">{title}</h1>
          <p className="cat-cover-subtitle">{subtitle}</p>
        </div>

        <div className="cat-cover-stats">
          <div>
            <div className="cat-cover-stat-value">{influencers.length}</div>
            <div className="cat-cover-stat-label">Créateurs</div>
          </div>
          <div>
            <div className="cat-cover-stat-value">{formatNumber(totalFollowers)}</div>
            <div className="cat-cover-stat-label">Followers cumulés</div>
          </div>
        </div>

        <div className="cat-cover-footer">
          KAINOVA GROUP · contact@mood-production.com · mood-agency.fr
        </div>
      </section>

      {/* FICHES CRÉATEURS (2 par page) */}
      {influencers.map((inf, idx) => {
        const total =
          (inf.instagram_followers || 0) +
          (inf.tiktok_followers || 0) +
          (inf.youtube_subscribers || 0);

        return (
          <section key={inf.id} className={`cat-card ${idx % 2 === 0 ? "cat-card-top" : "cat-card-bottom"}`}>
            <div className="cat-card-inner">
              {/* Header */}
              <div className="cat-card-header">
                {inf.profile_picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={inf.profile_picture_url} alt={inf.name} className="cat-avatar" />
                ) : (
                  <div className="cat-avatar cat-avatar-fallback">
                    {inf.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="cat-card-meta">
                  <div className="cat-card-name">{inf.name}</div>
                  <div className="cat-card-status">{STATUS_LABEL[inf.status]}</div>
                  {inf.bio && <div className="cat-card-bio">{inf.bio}</div>}
                  {inf.tags && inf.tags.length > 0 && (
                    <div className="cat-card-tags">
                      {inf.tags.slice(0, 5).map((t) => (
                        <span key={t} className="cat-tag">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="cat-card-total">
                  <div className="cat-card-total-value">{formatNumber(total)}</div>
                  <div className="cat-card-total-label">Audience totale</div>
                </div>
              </div>

              {/* Plateformes */}
              <div className="cat-platforms">
                {inf.instagram_handle && (
                  <PlatformBlock
                    name="Instagram"
                    handle={inf.instagram_handle}
                    primary={formatNumber(inf.instagram_followers)}
                    secondary={formatPercent(Number(inf.instagram_engagement_rate))}
                    color="#E1306C"
                  />
                )}
                {inf.tiktok_handle && (
                  <PlatformBlock
                    name="TikTok"
                    handle={inf.tiktok_handle}
                    primary={formatNumber(inf.tiktok_followers)}
                    secondary={formatPercent(Number(inf.tiktok_engagement_rate))}
                    color="#000"
                  />
                )}
                {inf.youtube_handle && (
                  <PlatformBlock
                    name="YouTube"
                    handle={inf.youtube_handle}
                    primary={formatNumber(inf.youtube_subscribers)}
                    secondary={formatNumber(inf.youtube_avg_views) + " vues moy."}
                    color="#FF0000"
                  />
                )}
              </div>
            </div>
          </section>
        );
      })}

      {/* DOS DE COUVERTURE */}
      <section className="cat-back">
        <div className="cat-back-mark">M</div>
        <h2 className="cat-back-title">Travaillons ensemble</h2>
        <p className="cat-back-text">
          Mood Agency accompagne marques et créateurs sur la stratégie d&apos;influence,
          la création de contenu et l&apos;activation média.
        </p>
        <div className="cat-back-contact">
          <div><strong>contact@mood-production.com</strong></div>
          <div>mood-agency.fr</div>
          <div className="cat-back-tagline">KAINOVA GROUP — SIRET 93477638600013</div>
        </div>
      </section>

      <style>{`
        .catalogue-print { font-size: 11px; line-height: 1.5; }

        /* ===== COUVERTURE ===== */
        .cat-cover {
          width: 210mm; height: 297mm;
          page-break-after: always;
          padding: 50mm 30mm;
          background: linear-gradient(135deg, #ff8a3d 0%, #ff5722 35%, #f43f5e 75%, #e11d48 100%);
          color: white;
          display: flex; flex-direction: column;
          position: relative;
        }
        .cat-cover-mark {
          width: 60px; height: 60px;
          border-radius: 18px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(20px);
          display: flex; align-items: center; justify-content: center;
          font-size: 30px; font-weight: 900;
          margin-bottom: 14px;
        }
        .cat-cover-brand { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; }
        .cat-cover-tagline { font-size: 12px; opacity: 0.8; letter-spacing: 0.18em; text-transform: uppercase; margin-top: 4px; font-weight: 600; }

        .cat-cover-center { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .cat-cover-title { font-size: 56px; font-weight: 900; letter-spacing: -0.04em; line-height: 1.05; margin: 0; }
        .cat-cover-subtitle { font-size: 18px; opacity: 0.85; margin-top: 12px; font-weight: 500; }

        .cat-cover-stats { display: flex; gap: 60px; margin-bottom: 30px; }
        .cat-cover-stat-value { font-size: 36px; font-weight: 900; letter-spacing: -0.03em; }
        .cat-cover-stat-label { font-size: 11px; opacity: 0.85; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700; margin-top: 4px; }

        .cat-cover-footer {
          font-size: 10px; opacity: 0.7; letter-spacing: 0.1em; text-transform: uppercase;
          border-top: 1px solid rgba(255,255,255,0.25); padding-top: 16px;
        }

        /* ===== FICHES CRÉATEURS — 2 par page ===== */
        .cat-card {
          width: 210mm; height: 148.5mm;
          padding: 12mm 14mm;
          box-sizing: border-box;
          background: white;
          page-break-inside: avoid;
        }
        .cat-card-bottom {
          border-top: 1px dashed #E5E7EB;
          page-break-after: always;
        }
        .cat-card-bottom:last-child { page-break-after: auto; }
        .cat-card-top:not(:first-of-type) { page-break-before: always; }

        .cat-card-inner {
          height: 100%;
          display: flex; flex-direction: column;
          gap: 12px;
          border: 1px solid #F3F4F6;
          border-radius: 16px;
          padding: 16px;
          background: linear-gradient(135deg, rgba(255,138,61,0.04) 0%, rgba(244,63,94,0.02) 100%);
        }

        .cat-card-header {
          display: grid;
          grid-template-columns: 80px 1fr auto;
          gap: 16px;
          align-items: start;
          padding-bottom: 12px;
          border-bottom: 1px solid #F3F4F6;
        }
        .cat-avatar {
          width: 80px; height: 80px; border-radius: 50%;
          object-fit: cover;
          border: 3px solid white;
          box-shadow: 0 4px 16px rgba(255,87,34,0.18);
        }
        .cat-avatar-fallback {
          background: linear-gradient(135deg, #ff8a3d, #f43f5e);
          color: white; display: flex; align-items: center; justify-content: center;
          font-size: 32px; font-weight: 900;
        }
        .cat-card-meta { min-width: 0; }
        .cat-card-name { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
        .cat-card-status {
          display: inline-block; margin-top: 3px;
          font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;
          color: #EA580C; background: #FFF4E5; padding: 2px 8px; border-radius: 999px;
        }
        .cat-card-bio { font-size: 11px; color: #6B7280; margin-top: 6px; line-height: 1.5; }
        .cat-card-tags { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; }
        .cat-tag {
          font-size: 9px; padding: 2px 7px; border-radius: 999px;
          background: #F3F4F6; color: #4B5563; font-weight: 600;
        }
        .cat-card-total { text-align: right; }
        .cat-card-total-value {
          font-size: 28px; font-weight: 800; letter-spacing: -0.03em;
          background: linear-gradient(135deg, #ff5722, #f43f5e);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .cat-card-total-label {
          font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em;
          font-weight: 700; color: #9CA3AF;
        }

        .cat-platforms {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          flex: 1;
        }
        .cat-platform {
          border-radius: 12px;
          padding: 12px;
          background: white;
          border: 1px solid #F3F4F6;
        }
        .cat-platform-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .cat-platform-dot { width: 10px; height: 10px; border-radius: 50%; }
        .cat-platform-name { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #374151; }
        .cat-platform-handle { font-size: 11px; color: #6B7280; margin-bottom: 8px; font-weight: 500; }
        .cat-platform-primary { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
        .cat-platform-secondary { font-size: 10px; color: #6B7280; margin-top: 2px; font-weight: 600; }

        /* ===== DOS DE COUVERTURE ===== */
        .cat-back {
          width: 210mm; height: 297mm;
          padding: 50mm 30mm;
          background: #0A0A0A; color: white;
          display: flex; flex-direction: column; justify-content: center;
          page-break-before: always;
        }
        .cat-back-mark {
          width: 60px; height: 60px;
          border-radius: 18px;
          background: linear-gradient(135deg, #ff8a3d, #f43f5e);
          display: flex; align-items: center; justify-content: center;
          font-size: 30px; font-weight: 900; color: white;
          margin-bottom: 24px;
        }
        .cat-back-title { font-size: 48px; font-weight: 900; letter-spacing: -0.04em; margin: 0 0 16px; }
        .cat-back-text { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.7); max-width: 380px; }
        .cat-back-contact { margin-top: 40px; font-size: 13px; line-height: 1.8; }
        .cat-back-contact strong {
          background: linear-gradient(135deg, #ff8a3d, #f43f5e);
          -webkit-background-clip: text; background-clip: text; color: transparent;
          font-weight: 800; font-size: 16px;
        }
        .cat-back-tagline { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-top: 16px; }
      `}</style>
    </div>
  );
}

function PlatformBlock({
  name,
  handle,
  primary,
  secondary,
  color,
}: {
  name: string;
  handle: string;
  primary: string;
  secondary: string;
  color: string;
}) {
  return (
    <div className="cat-platform">
      <div className="cat-platform-head">
        <span className="cat-platform-dot" style={{ background: color }} />
        <span className="cat-platform-name">{name}</span>
      </div>
      <div className="cat-platform-handle">@{handle}</div>
      <div className="cat-platform-primary">{primary}</div>
      <div className="cat-platform-secondary">{secondary}</div>
    </div>
  );
}
