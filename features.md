# VelStack — Feature Registry

> This document tracks every feature in the VelStack codebase. Each entry is derived from existing, implemented code.  
> **Last audited:** 2026-04-29

---

## Feature Index

| #  | Feature                        | Status           |
|----|--------------------------------|------------------|
| 1  | Authentication System          | ✅ Implemented   |
| 2  | User Management (Admin)        | ✅ Implemented   |
| 3  | Curriculum Builder             | ✅ Implemented   |
| 4  | Technology Management          | ✅ Implemented   |
| 5  | Note Versioning System         | ✅ Implemented   |
| 6  | Note Reading Experience        | ✅ Implemented   |
| 7  | Version Compare Mode           | ✅ Implemented   |
| 8  | Loader System                  | ✅ Implemented   |
| 9  | Public Learning Navigation     | ✅ Implemented   |
| 10 | Admin Dashboard (Legacy)       | ⚠️ In Progress   |
| 11 | Analytics & Event Tracking     | ⚠️ In Progress   |
| 12 | Role-Based Access Control      | ✅ Implemented   |

---

## 1. Authentication System

**Status:** ✅ Implemented  
**Scope:** Full signup → approval → login flow with JWT token auth.

### What exists

| Capability              | Frontend                              | Backend                           |
|-------------------------|---------------------------------------|-----------------------------------|
| Signup (name/email/pwd) | `SignupPage.tsx`                      | `auth_routes.py` → `AuthService.signup()` |
| Login                   | `LoginPage.tsx`                       | `auth_routes.py` → `AuthService.login()` |
| Token persistence       | `AuthContext.tsx` (localStorage)      | Flask-JWT-Extended                |
| Auto-sync across tabs   | `StorageEvent` listener in context    | —                                 |
| Logout                  | `Navbar.tsx`, `AdminDashboard.tsx`    | Client-side only (clear token)    |
| Approval gate           | Signup shows "awaiting approval" msg  | Login rejects `status != approved` |
| Auto-create admin       | —                                     | `AuthService.ensure_admin_account()` on startup |

### Constraints

- No password reset or "forgot password" flow.
- No email verification.
- No refresh token rotation — single JWT access token only.
- Admin credentials are seeded from `.env` vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).

### Pending work

- [ ] Password reset / forgot password flow
- [ ] Email verification on signup
- [ ] Token refresh mechanism

---

## 2. User Management (Admin)

**Status:** ✅ Implemented  
**Scope:** Admin can list, approve, and reject user accounts.

### What exists

| Capability        | Frontend                     | Backend                          |
|-------------------|------------------------------|----------------------------------|
| List all users    | `ManageUsers.tsx`            | `users_routes.py` → `AuthService.list_users()` |
| Filter pending    | `?filter=pending` query param | Client-side filter               |
| Approve user      | Approve button per row       | `AuthService.approve_user()`     |
| Reject user       | Reject button per row        | `AuthService.reject_user()`      |
| Role assignment   | —                            | `AuthService.set_role()` (API exists, no UI) |
| User table UI     | Full table with status badges | —                                |

### Constraints

- No bulk approve/reject.
- No user deletion (only status changes).
- Role assignment API exists but has no frontend UI.
- Uses `alert()` for error feedback on approve/reject failures.

### Pending work

- [ ] Role assignment UI (contributor / public / super_admin)
- [ ] Replace `alert()` with proper toast/banner feedback
- [ ] Bulk user actions
- [ ] User deletion capability

---

## 3. Curriculum Builder

**Status:** ✅ Implemented  
**Scope:** Full CRUD for a three-level tree (Section → Topic → Subtopic) scoped to a technology, with an editor drawer for note content.

### What exists

| Capability               | Frontend                              | Backend                              |
|--------------------------|---------------------------------------|--------------------------------------|
| View curriculum tree     | `CurriculumTree.tsx`                  | `topics_routes.py` → `TopicService`  |
| Add section/topic/subtopic | Inline add via `CurriculumTree`     | `TopicService.create_topic()`        |
| Rename nodes             | Inline rename                         | `TopicService.update_topic()`        |
| Delete nodes             | Confirm + delete                      | `TopicService.delete_topic()`        |
| Publish/unpublish nodes  | Toggle via context menu               | `TopicService.update_topic()`        |
| Select subtopic → drawer | Click subtopic → `EditorDrawer`       | `fetchNoteByTopic()`                 |
| Save note version        | JSON textarea → save                  | `VersionService.create_version()`    |
| Stats bar                | Section/topic/subtopic counts         | Client-side calculation              |
| Loading states           | Skeleton loaders, `PrimaryLoader`     | —                                    |
| Topic creation loading   | `isCreatingTopic` disables tree       | —                                    |
| Technology tab switching | Left sidebar tabs                     | `fetchCurriculum(techId)`            |

### Constraints

- Node hierarchy is exactly 3 levels: `section` → `topic` → `subtopic`.
- Only subtopic nodes can hold note content.
- Note content is submitted as raw JSON via textarea (no rich text editor).
- Sorting is `created_at ASC` — no drag-and-drop reordering.
- The `EditorDrawer` uses a fixed-width right-side slide panel (max 520px).

### Pending work

- [ ] Rich text / Markdown editor (replacing raw JSON textarea)
- [ ] Drag-and-drop reordering of nodes
- [ ] Batch operations (move, duplicate nodes)

---

## 4. Technology Management

**Status:** ✅ Implemented  
**Scope:** CRUD for top-level technology entries that scope the curriculum.

### What exists

| Capability           | Frontend                          | Backend                               |
|----------------------|-----------------------------------|---------------------------------------|
| List technologies    | Sidebar tabs in `CurriculumPage`  | `technologies_routes.py` → `TechnologyService` |
| Create technology    | Modal with name input             | `TechnologyService.create()`          |
| Rename technology    | Inline edit in sidebar tab        | `TechnologyService.update()`          |
| Delete technology    | Confirm dialog → delete           | `TechnologyService.delete()`          |
| Publish / unpublish  | Three-dot menu toggle             | `TechnologyService.update()`          |
| Draft badge          | "Draft" pill on unpublished tabs  | `is_published` column                 |
| Published/draft badge| Header shows status               | —                                     |
| Auto-slug generation | `slugify()` helper client-side    | —                                     |

### Constraints

- Deleting a technology deletes all associated topics and notes (cascade).
- Slug is generated client-side on creation; no server-side slug uniqueness enforcement visible.
- No technology icon or description field.

### Pending work

- [ ] Technology description / icon support
- [ ] Server-side slug uniqueness validation

---

## 5. Note Versioning System

**Status:** ✅ Implemented  
**Scope:** Multi-variant note content stored in `note_versions` table, linked via `notes` → `topic_id`.

### What exists

| Capability                  | Frontend                          | Backend                              |
|-----------------------------|-----------------------------------|--------------------------------------|
| Create note version         | `EditorDrawer`, `AdminDashboard`  | `VersionService.create_version()`    |
| Version types               | 6 types: simple, industry, interview, revision, realtime, theory | `VersionType` enum |
| Content stored as JSONB     | JSON textarea input               | `note_versions.content` JSONB column |
| Schema auto-migration       | —                                 | `VersionService.ensure_note_version_schema()` |
| Fetch versions by topic     | `fetchNoteByTopic()`              | Returns all versions keyed by type   |

### Constraints

- Content is raw JSON — no schema validation on content structure.
- No version history / audit trail (overwriting a version replaces it).
- No diff between versions.
- The six version types are hardcoded in both frontend and backend.

### Pending work

- [ ] Version history (keep previous revisions)
- [ ] Content schema validation
- [ ] Add/remove version types dynamically

---

## 6. Note Reading Experience

**Status:** ✅ Implemented  
**Scope:** Public-facing note page with structured content rendering, sidebar navigation, and table of contents.

### What exists

| Capability                | Component                       |
|---------------------------|---------------------------------|
| Structured note rendering | `NoteContent.tsx` — 12 section types (definition, problem_it_solves, detailed_explanation, core_concepts, how_it_works, syntax, code_example, practical_example, real_world_example, common_mistakes, best_practices, interview_notes) |
| Version switching         | `VersionTabs.tsx` — floating tab bar with icons |
| Sidebar curriculum tree   | `Sidebar.tsx` — collapsible tree with technology selector |
| Table of contents         | `TableOfContents.tsx` — auto-generated from note sections |
| Breadcrumb                | `topic › title` format in header |
| Responsive sidebar        | `<details>` collapsible on mobile, sticky on desktop |
| Skeleton loading           | Pulse animation skeleton on load |
| 404 handling              | Falls back to `NotFound` if note doesn't exist |

### Constraints

- Content rendering assumes specific JSON key names (12 hardcoded section types).
- No Markdown rendering — only plain text, lists, and code blocks.
- Code blocks have no syntax highlighting.
- Sidebar only shows published technologies.

### Pending work

- [ ] Markdown / rich text rendering
- [ ] Syntax highlighting for code blocks
- [ ] Search within notes

---

## 7. Version Compare Mode

**Status:** ✅ Implemented  
**Scope:** Side-by-side comparison of two note versions.

### What exists

| Capability              | Component                        |
|-------------------------|----------------------------------|
| Toggle compare mode     | Compare button in `VersionTabs`  |
| Side-by-side layout     | `CompareMode.tsx` — two columns  |
| Independent version selectors | Dropdown per column        |
| Full content rendering  | Each column renders `NoteContent` |

### Constraints

- No text-level diff highlighting — just side-by-side rendering of full content.
- Only works when at least 2 versions exist.
- Compare mode hides sidebar and table of contents.

### Pending work

- [ ] Text-level diff highlighting between versions

---

## 8. Loader System

**Status:** ✅ Implemented  
**Scope:** Three-tier loading indicator system in `components/Loader.tsx`.

### What exists

| Loader           | Type                    | Usage                                         |
|------------------|-------------------------|-----------------------------------------------|
| `PrimaryLoader`  | Vertical bar bounce     | Full-page overlays (`fullScreen`), section loads |
| `InlineLoader`   | Compact bar bounce      | Inside buttons, small UI regions              |
| `SavingLoader`   | Horizontal progress bar | Save/submit operations                        |
| `Loader` (default) | Backwards-compat wrapper | Legacy usage — delegates to Primary/Inline  |

### Animation system

- `animate-bar-bounce` — custom Tailwind keyframe for vertical bar loaders.
- `animate-progress-loop` — custom Tailwind keyframe for horizontal progress bar.
- Brand color: `bg-brand-orange` (Primary), `bg-current` (Inline).
- Overlay: `bg-white/60 backdrop-blur-sm dark:bg-slate-900/60` (fullScreen mode).

### Where used

| Loader         | Pages / Components                                    |
|----------------|-------------------------------------------------------|
| `PrimaryLoader`| `CurriculumPage` (fullscreen), `ManageUsers`          |
| `InlineLoader` | `CurriculumPage` (tech modal create button)           |
| Skeleton loaders | `CurriculumPage`, `NotePage`, `Sidebar` (pulse animations) |

### Constraints

- Some pages still use raw text loading indicators (`"Loading technologies..."` in `Home.tsx`, `Technologies.tsx`, `Topics.tsx`, `Categories.tsx`) instead of the loader components.

### Pending work

- [ ] Replace remaining raw text loading indicators with `PrimaryLoader` / `InlineLoader`
- [ ] Ensure `SavingLoader` is used in all save operations

---

## 9. Public Learning Navigation

**Status:** ✅ Implemented  
**Scope:** Multi-step public browsing flow: Home → Technologies → Topics → Note.

### What exists

| Page              | Route                 | Purpose                                      |
|-------------------|-----------------------|----------------------------------------------|
| `Home`            | `/`                   | Landing page with technology cards           |
| `Technologies`    | `/technologies`       | Grid of technology cards → navigate to topics |
| `Topics`          | `/topics/:tech_slug`  | Recursive module/topic list with drill-down  |
| `NotePage`        | `/notes/:slug`        | Full note reading experience                 |
| `Categories`      | `/categories`         | Learning paths view (technology links)       |
| `About`           | `/about`              | Static about page (4 info cards)             |
| `NotFound`        | `*`                   | 404 catch-all                                |

### Navbar

- Fixed header with blur backdrop.
- Desktop: Home, Learning Paths, About nav links + Login/Signup or user name + Logout.
- Mobile: Collapsible menu toggle.
- Admin: shows "Dashboard" link when authenticated as `super_admin`.

### Constraints

- No search functionality.
- No pagination on technology or topic listings.
- Categories page duplicates functionality of Technologies page.

### Pending work

- [ ] Global search
- [ ] Pagination for large content sets
- [ ] Consolidate Categories and Technologies pages (or differentiate purpose)

---

## 10. Admin Dashboard (Legacy)

**Status:** ⚠️ In Progress  
**Scope:** Older admin page with note version submission and user management toggle.

### What exists

| Capability                | Component              |
|---------------------------|------------------------|
| Add note version form     | JSON textarea + topic/version selectors |
| Toggle between Notes / Users | Tab buttons in sidebar |
| Embedded `UserManagement` | Inline user management view |
| Logout                    | Sidebar logout button  |

### Constraints

- This page (`AdminDashboard.tsx`) appears to be a **legacy view** — the newer admin experience uses `AdminLayout.tsx` with dedicated routes (`/admin/curriculum`, `/admin/users`).
- The route `/admin/dashboard` still renders this page.
- Uses blue (`bg-blue-600`) instead of the brand orange palette.
- Duplicates note version creation that already exists in the `EditorDrawer`.
- Uses hardcoded blue color scheme inconsistent with the brand design system.

### Pending work

- [ ] Decide: remove this legacy page or consolidate into the new admin layout
- [ ] Align styling with brand palette if keeping

---

## 11. Analytics & Event Tracking

**Status:** ⚠️ In Progress  
**Scope:** Backend event tracking for page views and version clicks.

### What exists

| Capability              | Backend                              | Frontend |
|-------------------------|--------------------------------------|----------|
| Track generic events    | `AnalyticsService.track_event()`     | —        |
| Track version views     | `AnalyticsService.track_view()`      | —        |
| Event types             | `PAGE_VIEW`, `VERSION_CLICK` (enum)  | —        |
| Event storage           | `analytics_events` table with JSONB metadata | — |
| IP + User-Agent capture | Extracted from request headers       | —        |
| Session tracking        | `session_id` column (optional)       | —        |
| Analytics route          | `analytics_routes.py`               | —        |

### Models

- `AnalyticsEvent` — stores event_type, topic_id, user_id, session_id, version_type, event_metadata (JSONB), user_ip, user_agent.
- `View` model also exists in `models/view.py`.

### Constraints

- **No frontend integration** — no API calls to analytics endpoints from the React app.
- No analytics dashboard or visualization.
- No reporting endpoints (aggregation, counts, trends).

### Pending work

- [ ] Frontend integration — call analytics API on page views and version switches
- [ ] Admin analytics dashboard with charts/tables
- [ ] Aggregation endpoints (views per topic, popular versions, etc.)

---

## 12. Role-Based Access Control

**Status:** ✅ Implemented  
**Scope:** Three-role system with route protection.

### What exists

| Role          | Capabilities                                              |
|---------------|-----------------------------------------------------------|
| `super_admin` | Full access: curriculum CRUD, user management, all admin routes |
| `contributor`  | Authenticated access (contributor flag exists, not enforced in current UI) |
| `public`       | Default signup role; view-only access after approval      |

### Frontend guards

| Guard                | Component          | Behavior                              |
|----------------------|--------------------|---------------------------------------|
| `ProtectedRoute`     | Wrapper component  | Redirects unauthenticated → `/login`  |
| `requireAdmin`       | Prop on guard      | Redirects non-admin → `/`             |
| `requireContributor` | Prop on guard      | Redirects non-contributor → `/`       |
| `isAdmin` checks     | `CurriculumPage`   | Hides CRUD buttons for non-admin      |

### Backend guards

- `@jwt_required()` on protected endpoints.
- Admin-only checks in route handlers.
- Status check on login (`status != "approved"` → rejected).

### Constraints

- `contributor` role exists in code but has no differentiated UI or permissions in practice.
- No role management UI (API exists via `AuthService.set_role()` but no frontend).
- No granular permissions (e.g., per-technology access).

### Pending work

- [ ] Define and enforce contributor permissions
- [ ] Role management UI for admins
- [ ] Granular, per-resource permissions (optional)
