import type { InfluencerStatus } from "@/lib/database.types";

export const STATUS_LABEL: Record<InfluencerStatus, string> = {
  signed: "Signé",
  activable: "Activable",
  prospect: "Prospect",
};

export const STATUS_DESCRIPTION: Record<InfluencerStatus, string> = {
  signed: "Signé chez Mood Agency",
  activable: "Pas signé mais activable pour des campagnes",
  prospect: "Cible — à signer",
};

/**
 * Variante Badge ("success", "primary", "muted", "warning", "danger") associée à chaque statut.
 * - signed : success vert (notre cœur de roster)
 * - activable : primary orange (network actif)
 * - prospect : muted gris (futur)
 */
export const STATUS_BADGE: Record<
  InfluencerStatus,
  "success" | "primary" | "muted" | "warning" | "danger"
> = {
  signed: "success",
  activable: "primary",
  prospect: "muted",
};
