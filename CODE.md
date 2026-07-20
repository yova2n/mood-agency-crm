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
| 2026-05 | **Autocomplete entreprises sur la création de marque** :<br>– Migration SQL `supabase/2026-05-brands-company-data.sql` ajoute `siren`, `siret`, `legal_form`, `naf_code`, `naf_label`, `address` à la table `brands`<br>– Endpoint `GET /api/companies/search?q=...` proxifie `recherche-entreprises.api.gouv.fr` (API gratuite, sans clé)<br>– Dropdown de suggestions en temps réel sur le champ "Nom" de `BrandSheet` (debounce 300ms)<br>– Au clic sur une suggestion, tous les champs légaux se remplissent<br>– Lien "Voir sur Pappers" visible dès qu'un SIREN est saisi (BrandSheet + BrandsList) |
| 2026-05 | **🔐 Durcissement sécurité complet** (suite alerte CTO) :<br>– **Critique** : suppression des policies RLS `anon read *` qui exposaient toutes les tables via la clé publique. Migration `supabase/2026-05-security-revoke-anon.sql`<br>– `/c/[slug]` passe en server-side avec `createAdminClient()` + validation du slug + filtres stricts (uniquement l'influenceur ciblé et les marques liées à ses collabs)<br>– **Next.js 16.2.4 → 16.2.9** : fix de 5 CVE (SSRF, middleware bypass, cache poisoning)<br>– **Headers HTTP** dans `next.config.ts` : HSTS 2 ans, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin, Permissions-Policy (CSP retiré temporairement après hotfix — cassait l'app, à réintroduire en mode report-only)<br>– Storage : policies update/delete restreintes au propriétaire de chaque fichier<br>– Mot de passe minimum : 6 → 8 caractères partout (login, signup, setup, profile)<br>– CODE.md section 11 entièrement réécrite : règles intangibles + checklist release + procédure rotation secrets |
| 2026-05 | **Onglet Campagnes — Saisie posts manuelle par créateur** :<br>– Nouvelle table `campaign_posts` : un post par ligne, multi-plateformes (instagram/story/reel, tiktok, youtube/shorts, snapchat, twitch, linkedin), stats complètes (views, likes, comments, shares, saves, reach, impressions, engagement_rate)<br>– `/dashboard/campagnes` : liste de tous les créateurs avec compte de publications<br>– `/dashboard/campagnes/[slug]` : éditeur par créateur (KPIs agrégés, filtres par plateforme, ajout/édition/suppression de posts via Sheet)<br>– Composants `campaign-editor.tsx` et `post-sheet.tsx` |
| 2026-05 | **Refonte dashboard public créateur — `/c/[slug]`** :<br>– Design glassmorphism Apple, palette orange/cuivré (fond `#100806` + radial gradients orange/rose)<br>– `.apple-card` : backdrop-blur 24px, border subtle, shadow cuivrée<br>– Tabs : Vue globale + tab par plateforme (Instagram, TikTok, YouTube, Snapchat, Twitch, LinkedIn) avec compteurs<br>– KPIs avec trends (% sur 1ère vs 2e moitié des posts)<br>– PlatformCards avec gradient par réseau, follower count + engagement + évolution<br>– Grid de posts avec thumbnail, stats compactes, reach/engagement, lien vers post original<br>– Responsive mobile parfait via grid Tailwind |
| 2026-05 | **Onglet Facturation — CRM complet de factures Kainova Group** :<br>– Tables `invoices` + `invoice_items` (cascade delete), enum `invoice_status` (draft/sent/paid/cancelled)<br>– `/dashboard/facturation` : liste avec KPIs (total émises, envoyées, en attente €, payées €) + recherche<br>– `/dashboard/facturation/nouvelle` : génération auto du numéro `FAC-YYYY-XXXX` (count année)<br>– `/dashboard/facturation/[id]` : édition + boutons Marquer envoyée / Marquer payée / Export PDF / Envoyer par email (mailto:)<br>– Préremplissage automatique du destinataire si marque sélectionnée (utilise les colonnes ajoutées en mai : address, siret, etc.)<br>– Émetteur par défaut hardcodé Mood Agency / Kainova Group (overridable au cas par cas)<br>– Génération PDF : composant `invoice-print.tsx` avec CSS `@media print` (A4, 18mm marges) — bouton "Export PDF" appelle `window.print()`, l'utilisateur choisit "Enregistrer en PDF" dans la dialog navigateur (pas de dépendance lourde)<br>– Lignes d'items avec total HT calculé en live, TVA configurable, totaux HT/TVA/TTC affichés |
| 2026-07 | **Signature + cachet automatiques sur les factures** :<br>– Chaque PDF de facture est désormais signé et tamponné au nom de **KAINOVA GROUP — Yovann Pigenet** (bas de page, cachet bleu encre incliné + signature manuscrite)<br>– Ajout du téléphone société `07 49 64 48 19` dans le bloc émetteur + le cachet<br>– Constantes `ISSUER_PHONE` / `ISSUER_SIGNATORY` / `ISSUER_SIGNATORY_ROLE` dans `invoice-form.tsx`, props `phone` / `signatory` / `signatoryRole` sur `invoice-print.tsx`<br>– `print-color-adjust: exact` pour que le cachet + les badges de statut s'impriment en couleur<br>– Rappel : l'onglet Facturation est accessible à **tous les rôles** (admin + manager), donc Zakaria peut créer/remplir des factures |

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

## 11. 🔐 Sécurité — RÈGLES CRITIQUES

Lire ce bloc à CHAQUE session avant de modifier quoi que ce soit côté auth, DB ou upload.

### Principes intangibles

1. **JAMAIS de policy `to anon ... using (true)`** sur les tables `public.*`. La clé anon est embarquée dans le bundle JS, donc publique. Si une page non-loggée doit lire de la donnée, elle passe par un **endpoint serveur** qui utilise `createAdminClient()` (service_role) avec un filtre strict.
2. **`SUPABASE_SERVICE_ROLE_KEY` ne quitte JAMAIS le serveur.** Le fichier `src/lib/supabase/admin.ts` commence par `import "server-only"` — toute tentative d'import depuis un composant client casse le build (et c'est volontaire).
3. **Endpoints sensibles = auth + check de rôle systématique.** Pattern dans `/api/team/invite/route.ts` :
   1. Récupérer l'utilisateur via le client serveur (cookies).
   2. Charger son rôle depuis `profiles`.
   3. Refuser si pas admin.
4. **Toute nouvelle migration SQL** doit être ajoutée dans `supabase/` avec un nom daté (`AAAA-MM-description.sql`) et listée ci-dessous dans l'historique.
5. **Aucun secret en clair dans le repo ni dans les conversations partagées.** Les tokens GitHub, clés API, mots de passe ne sont jamais commités. Si un secret est exposé par erreur, le révoquer immédiatement et en générer un nouveau.

### Architecture des couches d'accès

| Surface | Client utilisé | Cas d'usage |
|---|---|---|
| Server Component du dashboard | `createClient()` (cookies, anon key) | Tout le contenu protégé par auth Supabase — RLS s'applique |
| Route Handler avec admin scope | `createAdminClient()` (service_role) | Endpoints API qui font des opérations admin (invite, etc.) |
| Page publique (`/c/[slug]`, `/auth/setup`) | `createAdminClient()` côté serveur uniquement, ou `createClient()` côté client après hash exchange | JAMAIS de `using (true)` côté RLS — c'est NOTRE serveur qui filtre |
| Browser interactif (boutons, formulaires) | `createClient()` browser | Pour les actions de l'utilisateur connecté, RLS s'applique |

### Headers HTTP

Définis dans `next.config.ts` (modifier prudemment) :
- **CSP** strict : `default-src 'self'`, autorise uniquement Supabase + l'API gouv en `connect-src`.
- **HSTS** : `max-age=63072000; includeSubDomains; preload`
- **X-Frame-Options: DENY** + `frame-ancestors 'none'` (anti-clickjacking)
- **X-Content-Type-Options: nosniff**
- **Referrer-Policy: strict-origin-when-cross-origin**
- **Permissions-Policy** : camera/micro/geo désactivés par défaut

Si tu ajoutes un domaine tiers (Stripe, Sentry, GA…), il faut explicitement l'ajouter au CSP.

### Checklist à chaque release

- [ ] `npm audit --omit=dev` : aucune vulnérabilité HIGH/CRITICAL non résolue
- [ ] Pas de policy RLS `to anon` nouvellement créée
- [ ] Toute nouvelle route `/api/*` qui mute des données vérifie auth + rôle
- [ ] Tout endpoint qui utilise `createAdminClient()` filtre strictement les données retournées (jamais `select *` sans `eq/in/filter`)
- [ ] Toute nouvelle dépendance npm est mainstream et maintenue (pas de package abandonné)
- [ ] Variables d'env Vercel : aucune clé sensible n'a été déplacée vers `NEXT_PUBLIC_*`
- [ ] Logs : pas de `console.log` qui balance des données utilisateur en prod

### Rotation des secrets

À rotater si exposition (ou tous les 6 mois par hygiène) :
- **GitHub Personal Access Token** : https://github.com/settings/tokens
- **Supabase service_role key** : Supabase Dashboard → Settings → API → rotate. Penser à update Vercel + `.env.local`.
- **Supabase anon key** : si rotatée, la rotation se propage à tous les clients (déconnexion). À faire seulement si compromise.

### Comptes à protéger en priorité

| Compte | 2FA recommandée ? | Critique ? |
|---|---|---|
| GitHub (`yova2n`) | OUI | Oui — accès au code, peut déclencher des déploiements |
| Vercel | OUI | Oui — accès aux env vars de prod |
| Supabase | OUI | Critique — accès direct à la base de données |
| Compte email racine (Gmail) | OUI | Critique — reset password de tout le reste |

### Points connus non résolus (acceptés ou à traiter)

- **`postcss` < 8.5.10** (moderate XSS) : non exploitable car postcss tourne au build, jamais avec du contenu user à runtime. Sera résolu au prochain bump mineur de Next.
- **`ws` (moderate)** : non utilisé directement, dépendance indirecte de dev. Sera résolu via update upstream.
- **Pas de rate limiting custom** sur les Route Handlers. Supabase rate-limite les appels Auth (sign in/up), Vercel rate-limite les fonctions au niveau plateforme. Pour `/api/team/invite` ça reste à ajouter si abus constaté.
- **Pas de 2FA app-level** : la connexion Supabase est mot de passe seul. Pour upgrade : activer le MFA TOTP côté Supabase Auth.

---

## 12. Points d'attention pour les futures évolutions

- **`@/lib/supabase/admin.ts` ne doit JAMAIS être importé côté client.** Le `"server-only"` en haut du fichier protège déjà, mais rester vigilant.
- **Avant tout nouveau champ financier** : penser à appliquer la logique admin/manager (masquage UI + RLS Supabase si nécessaire).
- **Build Vercel** : Recharts est strict sur les types `Formatter`. Pour tout nouveau chart, utiliser `(v) => formatX(Number(v))` au lieu de `(v: number) =>`.
- **Nouvelle page protégée** : pas besoin de la déclarer dans le middleware, le `else` du proxy gère tout ce qui n'est pas public.
- **Nouvelle page publique** : ajouter le path dans `src/lib/supabase/proxy.ts` (`isPublicPage`).
- **Nouvelle table Supabase** : ajouter le type dans `src/lib/database.types.ts` à la main (pas de génération auto pour l'instant).

---

## 13. Contexte business (en bref)

Ne pas oublier : ce CRM sert à une vraie agence qui veut **du concret**, **du visuel léché**, **zéro friction**. Le ton interne est direct, ambitieux, jamais corporate. Si une décision UI/UX est ambigüe, trancher dans le sens de la simplicité visuelle et de l'efficacité opérationnelle (voir aussi `/Users/yovann/Documents/Claude Code/logiciel-mood-agency/CLAUDE.md` pour le contexte Yovann + écosystème Kainova).
