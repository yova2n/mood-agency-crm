import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CompanySearchResult } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const GOUV_API = "https://recherche-entreprises.api.gouv.fr/search";

// Type minimal de ce qu'on lit dans la réponse de l'API gouv
type GouvSiege = {
  siret?: string;
  adresse?: string;
  libelle_commune?: string;
  code_postal?: string;
  geo_adresse?: string;
};

type GouvResult = {
  siren?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  siege?: GouvSiege;
  nature_juridique?: string;
  libelle_nature_juridique?: string;
  activite_principale?: string;
  libelle_activite_principale?: string;
  section_activite_principale?: string;
  etat_administratif?: string;
  date_creation?: string;
};

type GouvResponse = {
  results?: GouvResult[];
  total_results?: number;
};

function normalize(r: GouvResult): CompanySearchResult | null {
  if (!r.siren || !r.siege?.siret) return null;
  return {
    siren: r.siren,
    siret: r.siege.siret,
    name: r.nom_complet ?? r.nom_raison_sociale ?? "",
    legal_form: r.libelle_nature_juridique ?? null,
    naf_code: r.activite_principale ?? null,
    naf_label: r.libelle_activite_principale ?? null,
    address: r.siege.geo_adresse ?? r.siege.adresse ?? null,
    city: r.siege.libelle_commune ?? null,
    postcode: r.siege.code_postal ?? null,
    active: r.etat_administratif === "A",
    date_creation: r.date_creation ?? null,
  };
}

export async function GET(request: Request) {
  // Protège l'endpoint : utilisateur connecté uniquement
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL(GOUV_API);
  url.searchParams.set("q", q);
  url.searchParams.set("per_page", "8");
  // Privilégier les entreprises actives en premier
  url.searchParams.set("etat_administratif", "A");

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      // Cache léger pour éviter de marteler l'API gouv en cas de double clic
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `API gouv : ${res.status}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as GouvResponse;
    const results = (data.results ?? [])
      .map(normalize)
      .filter((r): r is CompanySearchResult => r !== null);

    return NextResponse.json({ results, total: data.total_results ?? 0 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur réseau" },
      { status: 500 }
    );
  }
}
