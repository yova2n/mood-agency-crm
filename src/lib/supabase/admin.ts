import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client admin Supabase — usage SERVEUR uniquement.
 * Ne JAMAIS importer depuis un composant client.
 * Utilise la service_role key qui bypass toutes les RLS.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Variables d'env manquantes : NEXT_PUBLIC_SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
