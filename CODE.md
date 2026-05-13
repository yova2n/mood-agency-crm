# CODE.md — Mémoire technique Mood Agency CRM

> Ce fichier sert de **brief complet pour toute nouvelle session Claude Code**.
> Lire en premier — il évite de relire tout le codebase et économise des tokens.
> À mettre à jour quand l'architecture évolue ou qu'une fonctionnalité majeure est livrée.

---

## 1. Vue d'ensemble

**Mood Agency CRM** — outil interne pour l'agence d'influence Mood Agency (Yovann Pigenet, Kainova Group).
Gère **influenceurs, marques, collaborations, calendrier, équipe**.

- **Repo GitHub** : https://github.com/yova2n/mood-agency-crm (public)
- **Prod Vercel** : https://mood-agency-crm.vercel.app
- **Compte propriétaire** : `yova2n` (GitHub) / `yovann.contact@gmail.com` (Vercel)
- **Owner Vercel** : `Yann's projects` (Hobby tier)
- **Auto-deploy** : chaque `git push` sur `main` déclenche un déploiement Vercel

---

## 2. Stack technique

| Domaine | Choix | Notes |
|---|---|---|
| Framework | **Next.js 16.2.4** | App Router, Turbopack, Server Components par défaut |
| React | 19.2.4 | |
| Langage | TypeScript strict | `tsconfig.json` standard Next |
| Styling | **Tailwind CSS 4** | `@theme` dans `globals.css`, pas de `tailwind.config.js` |
| UI primitives | Radix UI | Select, Dialog, Dropdown, Popover, Tabs, Tooltip, etc. |
| Icônes | `lucide-react` | |
| Charts | `recharts` 3.x | |
| Animation | `framer-motion` | |
| Toasts | `sonner` | |
| Formulaires | `react-hook-form` + `zod` | |
| Backend | **Supabase** | Auth + Postgres + Storage |
| Hosting | Vercel | Variables d'env via dashboard Vercel |

⚠️ **Attention Next.js 16** : APIs différentes de Next 13/14/15 (cf. `AGENTS.md`). Toujours vérifier `node_modules/next/dist/docs/` avant d'écrire du code orienté framework.

---

## 3. Structure du projet

```
mood-agency-crm/
├── CLAUDE.md             # @AGENTS.md
├── AGENTS.md             # Avertissement Next.js 16
├── CODE.md               # CE FICHIER
├── README.md
├── package.json
├── .env.local            # Secrets (gitignored)
├── .env.local.example    # Template public
├── supabase/             # Scripts SQL (à exécuter dans Supabase SQL Editor)
│   ├── schema.sql                    # Tables + triggers + RLS de base
│   ├── public-creator-policies.sql   # RLS pour la vue publique /c/[slug]
│   └── storage-setup.sql             # Buckets Storage (avatars, logos, etc.)
└── src/
    ├── proxy.ts                       # Middleware Next.js (auth gate)
    ├── app/
    │   ├── layout.tsx                 # Layout racine (police, fond, toaster)
    │   ├── globals.css                # Thème + utilities + fix autofill
    │   ├── page.tsx                   # Redirige selon auth
    │   ├── login/                     # Page publique de connexion + signup
    │   ├── auth/setup/                # Page publique d'activation après invitation
    │   ├── c/[slug]/                  # Vue publique d'un créateur (lien partageable)
    │   ├── api/team/invite/           # POST — invite un membre (admin-only, service_role)
    │   └── dashboard/
    │       ├── layout.tsx             # Sidebar + protection auth
    │       ├── page.tsx               # KPIs, charts, dernières collabs
    │       ├── influenceurs/
    │       │   ├── page.tsx           # Liste
    │       │   └── [slug]/page.tsx    # Détail
    │       ├── marques/page.tsx
    │       ├── collaborations/page.tsx
    │       ├── calendrier/page.tsx
    │       └── parametres/page.tsx    # Admin-only (gestion équipe + profil)
    ├── components/
    │   ├── ui/                        # Primitives (Input, Select, Card, Dialog, ...)
    │   ├── dashboard/                 # KPI cards, charts, header
    │   ├── layout/sidebar.tsx
    │   ├── influencers/
    │   ├── brands/
    │   ├── collaborations/
    │   ├── calendar/
    │   ├── creator-public/
    │   └── settings/
    │       ├── profile-settings.tsx   # Mon profil (nom, avatar, mot de passe)
    │       └── team-management.tsx    # Liste équipe + invitation + rôles
    └── lib/
        ├── utils.ts                   # cn(), helpers
        ├── database.types.ts          # Types TS des tables Supabase
        └── supabase/
            ├── client.ts              # Browser client (anon key)
            ├── server.ts              # Server client (anon key, cookies)
            ├── proxy.ts               # Middleware updateSession()
            └── admin.ts               # Server-only admin client (service_role)
```

---

## 4. Modèle de données Supabase

### Tables principales

| Table | Description |
|---|---|
| `profiles` | Liée à `auth.users` 1:1. Contient `full_name`, `role` (`admin` / `manager`), `avatar_url`. |
| `influencers` | Créateurs gérés par l'agence. Slug unique, handles social, stats temps réel. |
| `influencer_stats_snapshots` | Historique des stats par plateforme et date. |
| `brands` | Marques partenaires. |
| `collaborations` | Lien marque ↔ créateur. Type (`agence` / `direct`), apporteur, statut, budget, commission. |
| `calendar_events` | Évènements (publications, deadlines, réunions). |

### Enums

`user_role` = `admin` | `manager`
`influencer_status` = `actif` | `inactif` | `en_attente`
`platform` = `instagram` | `tiktok` | `youtube`
`collab_type` = `agence` | `direct`
`apporteur_type` = `createur` | `agent` | `agence`
`collab_status` = `en_cours` | `terminee` | `annulee`
`event_type` = `publication` | `campagne` | `deadline` | `reunion`

### Trigger clé

`on_auth_user_created` → à chaque `INSERT auth.users`, crée automatiquement une ligne dans `profiles` avec `role='manager'` par défaut. Le `full_name` vient de `raw_user_meta_data->>'full_name'` ou de la partie locale de l'email.

---

## 5. Authentification & Autorisation

### Flow utilisateur

1. **Page racine** (`/`) → redirige vers `/dashboard` si connecté, sinon `/login`.
2. **Middleware `src/proxy.ts`** (via `src/lib/supabase/proxy.ts`) :
   - Refresh la session via `supabase.auth.getUser()`
   - Pages **publiques** : `/`, `/login`, `/c/*`, `/auth/*`
   - Connecté + sur `/login` → redirige vers `/dashboard`
   - Pas connecté + page protégée → redirige vers `/login`
3. **Paramètres** (`/dashboard/parametres`) : **admin-only** (vérification serveur dans `page.tsx`).

### 3 façons d'arriver dans l'app

| Méthode | Description |
|---|---|
| **Self-signup** | Bouton "Créer un compte" sur `/login`. Rôle `manager` par défaut. |
| **Création manuelle** | Depuis Supabase Dashboard → Auth → Users → Add user. |
| **Invitation depuis l'app** | Bouton "Inviter un membre" dans Paramètres → Équipe. Envoie un email Supabase, lien vers `/auth/setup`. Permet de fixer le rôle dès l'envoi. |

### Rôles

- **Admin** : accès total, voit/modifie les montants en €, gère l'équipe.
- **Manager** : tout sauf les montants financiers (budgets, commissions, CA).

L'application masque les champs financiers côté UI selon `profile.role`. La distinction est aussi appliquée côté Supabase via RLS (à vérifier dans `schema.sql`).

---

## 6. Variables d'environnement

Dans `.env.local` (local) **et** Vercel Dashboard → Settings → Environment Variables :

```
NEXT_PUBLIC_SUPABASE_URL=https://bcvmhzokqqqtdelfgkyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # ⚠️ SECRET — server-only, jamais client
```

- `NEXT_PUBLIC_*` : exposées au browser, utilisées par `createClient()` (browser et server avec cookies).
- `SUPABASE_SERVICE_ROLE_KEY` : utilisée uniquement par `src/lib/supabase/admin.ts` (importée avec `import "server-only"`).

### Configuration Supabase à vérifier

- **Auth → URL Configuration** :
  - Site URL : `https://mood-agency-crm.vercel.app`
  - Redirect URLs : `https://mood-agency-crm.vercel.app/**`, `http://localhost:3000/**`
- **Auth → Providers → Email** : confirmation email **désactivée** (pour éviter friction).

---

## 7. Conventions de code

- **Composants serveur par défaut**, `"use client"` uniquement si interactivité nécessaire.
- **Routes dynamiques** : `force-dynamic` ajouté quand la page utilise `auth.getUser()`.
- **Toasts** : utiliser `toast` de `sonner`. Toujours en français.
- **Types DB** : importer depuis `@/lib/database.types`, jamais redéfinir.
- **Couleurs** : utiliser les classes Tailwind (`text-white/60`, `bg-orange-500/15`, etc.) ou les CSS vars (`var(--color-primary)`). Pas de hex en dur sauf dans `globals.css`.
- **Forme des champs** : `rounded-full` (Input, Select), `rounded-3xl` (Card), `rounded-2xl` (sub-cards).
- **Fond des champs** : `bg-[#2a2320]` solide (pas de transparent — évite les bugs avec autofill / accessibilité macOS).

---

## 8. Identité visuelle

Thème **dark warm** (cuivré / coucher de soleil) — pas de mode clair.

- Fond : `#1c1815`
- Texte : `#fafaf9`
- Couleur primaire : **orange Mood** `#ff5722` (avec dégradé vers rose `#f43f5e`)
- Police : **Inter**
- Utilities CSS custom : `.glass`, `.glass-strong`, `.gradient-mood`, `.gradient-text`, `.sunset-bg`, `.glow-primary`, etc.

---

## 9. Historique des décisions importantes

| Date | Décision / Livrable |
|---|---|
| 2026-04 | Création initiale du CRM (dashboard, influenceurs, marques, collabs, calendrier, settings) |
| 2026-04 | Mise en ligne sur GitHub (`yova2n/mood-agency-crm`) puis Vercel |
| 2026-04 | Fix typage Recharts (`formatter` accepte `ValueType | undefined`) pour passer le build Vercel |
| 2026-04 | Désactivation de la confirmation email Supabase (friction → outil interne) |
| 2026-04 | Configuration Site URL + Redirect URLs Supabase pour la prod Vercel |
| 2026-04 | Premier compte créé via self-signup : Zakaria Aoun (admin) |
| 2026-04 | **Système d'invitation depuis l'app** (Paramètres → Équipe) :<br>– Endpoint `/api/team/invite` (admin-only)<br>– Client admin `src/lib/supabase/admin.ts`<br>– Page publique `/auth/setup` (définition du mot de passe après clic email)<br>– Middleware mis à jour pour rendre `/auth/*` public |
| 2026-04 | Fix autofill (Safari/Chrome forçaient un fond blanc sur les inputs) :<br>– CSS `input:-webkit-autofill` dans `globals.css`<br>– Background solide `bg-[#2a2320]` sur Input/Select/Textarea (au lieu de transparent) |

---

## 10. Commandes utiles

```bash
# Dev local
npm run dev            # http://localhost:3000

# Build (vérifie TS + Next)
npm run build

# Lint
npm run lint

# Git push (auto-deploy Vercel)
git add -A && git commit -m "..." && git push
```

---

## 11. Points d'attention pour les futures évolutions

- **`@/lib/supabase/admin.ts` ne doit JAMAIS être importé côté client.** Le `"server-only"` en haut du fichier protège déjà, mais rester vigilant.
- **Avant tout nouveau champ financier** : penser à appliquer la logique admin/manager (masquage UI + RLS Supabase si nécessaire).
- **Build Vercel** : Recharts est strict sur les types `Formatter`. Pour tout nouveau chart, utiliser `(v) => formatX(Number(v))` au lieu de `(v: number) =>`.
- **Nouvelle page protégée** : pas besoin de la déclarer dans le middleware, le `else` du proxy gère tout ce qui n'est pas public.
- **Nouvelle page publique** : ajouter le path dans `src/lib/supabase/proxy.ts` (`isPublicPage`).
- **Nouvelle table Supabase** : ajouter le type dans `src/lib/database.types.ts` à la main (pas de génération auto pour l'instant).

---

## 12. Contexte business (en bref)

Ne pas oublier : ce CRM sert à une vraie agence qui veut **du concret**, **du visuel léché**, **zéro friction**. Le ton interne est direct, ambitieux, jamais corporate. Si une décision UI/UX est ambigüe, trancher dans le sens de la simplicité visuelle et de l'efficacité opérationnelle (voir aussi `/Users/yovann/Documents/Claude Code/logiciel-mood-agency/CLAUDE.md` pour le contexte Yovann + écosystème Kainova).
