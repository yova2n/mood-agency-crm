import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Body = {
  email?: string;
  full_name?: string;
  role?: "admin" | "manager";
};

export async function POST(request: Request) {
  // 1. Vérifie que l'appelant est connecté
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // 2. Vérifie qu'il est admin
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") {
    return NextResponse.json(
      { error: "Réservé aux administrateurs" },
      { status: 403 }
    );
  }

  // 3. Parse + valide le body
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const fullName = body.full_name?.trim() || email?.split("@")[0] || "";
  const role: "admin" | "manager" =
    body.role === "admin" ? "admin" : "manager";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  // 4. Envoie l'invitation Supabase
  const admin = createAdminClient();
  const origin = new URL(request.url).origin;

  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${origin}/auth/setup`,
    });

  if (inviteError || !invited?.user) {
    return NextResponse.json(
      {
        error:
          inviteError?.message?.includes("already")
            ? "Cet email a déjà un compte"
            : inviteError?.message || "Échec de l'invitation",
      },
      { status: 400 }
    );
  }

  // 5. Met à jour le rôle dans profiles (le trigger crée la ligne en 'manager' par défaut)
  const { error: updateError } = await admin
    .from("profiles")
    .update({ full_name: fullName, role })
    .eq("id", invited.user.id);

  if (updateError) {
    return NextResponse.json(
      {
        error: `Invitation envoyée mais rôle non appliqué : ${updateError.message}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    user_id: invited.user.id,
    email,
    role,
  });
}
