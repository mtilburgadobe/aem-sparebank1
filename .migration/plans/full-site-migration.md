# SpareBank 1 — Full Site Migration Plan (nb/bank tree)

## Status: Ready to Execute

This plan is finalized and execution-ready. **Actually running Phase 0 requires Execute mode** — while Plan mode is active I cannot fetch the sitemap, write files, or run discovery scripts. Switch the session to Execute mode and the first action will be Phase 0, step 1 (fetch `robots.txt` + `sitemap.xml` and build the scoped `/nb/bank/` URL inventory).

## Goal

Migrate the complete `https://www.sparebank1.no/nb/bank/*` tree (Privat + Bedrift + Om oss and everything beneath) to AEM Edge Delivery Services, reusing the blocks, global styles, header, and footer already built for the `privat` page. Approach: **discover via sitemap → classify into templates → perfect one representative page per template → bulk-import the rest → validate → publish.**

## Scope & Assumptions

- **In scope:** all URLs under `/nb/bank/` (Privat, Bedrift, Om oss subtrees).
- **Discovery source:** the source site's `sitemap.xml` (and any nested sitemaps referenced by `robots.txt`), filtered to the `/nb/bank/` path prefix.
- **Sequencing:** templates-first, then bulk import — appropriate for the expected scale (likely hundreds of pages).
- **Already done (reuse, don't rebuild):** `privat` page, header (nav), footer, global styles, and blocks `hero-campaign`, `cards-topic`, `cards-news`, `columns`/`columns-promo`, `bank-picker`, plus the `columns` link-columns auto-block and `section-metadata` handling in `scripts.js`.
- **Content target:** Document Authoring (`doc` project, org/repo `mtilburgadobe/aem-sparebank1`); content served at root in production, under `/content/` locally.
- **Known guardrails to carry forward:** run the SVG optimizer after each import (40KB limit); never raw-POST rendered `.plain.html` to DA (flattens blocks); fragment/image refs must resolve both `/content/`-local and root-production.

## Open Questions / Risks (to confirm during execution)

- [ ] Sitemap size — if the `/nb/bank/` tree is very large (500+ pages), confirm wave strategy (Privat → Bedrift → Om oss vs all at once) after the count is known.
- [ ] Page types that may need **new** blocks or special handling: article/news pages, calculator/tool pages (interactive widgets), forms (e.g. "Bli kunde", "Meld skade"), tables/price lists, accordions/FAQ.
- [ ] Localization: the tree may include `/nn/` (Nynorsk) and regional bank subpaths — confirm whether those are in scope now or later.
- [ ] Volume of oversized SVGs / DAM images to optimize.

## Phase 0 — Discovery & Scoping (FIRST — begins on Execute mode)

- [ ] Fetch `robots.txt` + `sitemap.xml` from the source; enumerate all URLs, filter to `/nb/bank/`.
- [ ] Produce a scoped URL inventory (count + list), grouped by subtree (privat / bedrift / om-oss) and by URL-path pattern.
- [ ] Flag likely "special" pages (articles, calculators, forms, price tables) for template review.
- [ ] Present the inventory + proposed wave breakdown for confirmation before large-scale work.

## Phase 1 — Template Classification (site analysis)

- [ ] Group URLs into structural templates via skeleton extraction (signature-based), selecting a representative "primary" URL per template and identifying coverage-gap pages.
- [ ] Produce/extend `tools/importer/page-templates.json` with each template's `urls[]`, `coverageGaps`, and empty `blocks[]`.
- [ ] Expected templates (to validate against real data): `bank-landing-page` (already exists), `article/news`, `product/topic detail`, `tool/calculator`, `kundeservice/help`, `om-oss/info`, plus any others discovery surfaces.

## Phase 2 — Per-Template Analysis, Block Mapping & Infrastructure

For **each** new template (repeat):

- [ ] Run page analysis on the primary URL (+ gap pages) → section boundaries, authoring decisions, block variants, cleaned HTML, screenshots.
- [ ] Map blocks + sections onto `page-templates.json` (`block-mapping-manager`), reusing existing block variants where structures match; only introduce a new block variant when genuinely new.
- [ ] Generate/extend parsers + transformers (`excat-import-infrastructure`) and the import script (`excat-import-script`) for the template.
- [ ] Build/verify CSS + JS for any **new** blocks; style to match source (measured, validation-first, matching the existing block quality bar).

## Phase 3 — Bulk Content Import (per template, per wave)

- [ ] Run the bundled import script over each template's URL list → generates `content/**.plain.html` + import reports.
- [ ] Run the SVG optimizer sweep (`npm run import:optimize-svgs`) after each import batch to keep every SVG under 40KB.
- [ ] Spot-check a sample of imported pages locally (`localhost:3000/content/...`) for structural fidelity.

## Phase 4 — Validation & Visual QA

- [ ] Run import validation (`excat-import-validation`) to score content completeness across all imported pages; drill into any flagged below threshold.
- [ ] Run visual critique (page mode) on representative + flagged pages; route content/structural diffs back to the parser/transformer fix loop and re-import.
- [ ] Iterate flagged → fix → re-validate (cap at ~3 rounds per page, then surface remaining divergences).

## Phase 5 — Publish

- [ ] Upload imported content to Document Authoring (via the import pipeline / DA source API — never raw rendered `.plain.html`).
- [ ] Preview + publish pages via `admin.hlx.page` (preview → live), in waves.
- [ ] Re-run the SVG sweep if any 409 (oversized SVG) errors occur during preview/publish.
- [ ] Verify fragment/image path resolution on production (root vs `/content/`), reusing the dual-fetch pattern already in place.

## Phase 6 — Cross-Cutting Finishing

- [ ] Confirm header, footer, and global styles render correctly across the new page types (not just privat).
- [ ] Confirm auto-blocks (`link-columns`, `section-metadata`) behave on the new pages.
- [ ] PageSpeed Insights pass on a representative feature-preview URL per template; fix regressions toward a 100 target.
- [ ] Push all code (blocks/parsers/transformers/scripts) to `main`; open PR(s) with a feature-preview link per template per the project's publishing process.

## Checklist (high-level)

- [ ] **Phase 0:** Sitemap discovery + scoped `/nb/bank/` URL inventory + wave plan confirmed
- [ ] **Phase 1:** Templates classified; `page-templates.json` populated
- [ ] **Phase 2:** Per-template analysis, block mapping, parsers/transformers/import scripts, new block code
- [ ] **Phase 3:** Bulk import per template + SVG optimization sweeps
- [ ] **Phase 4:** Import-completeness validation + visual critique + fix/re-import loop
- [ ] **Phase 5:** Upload to DA + preview + publish (waves)
- [ ] **Phase 6:** Header/footer/global-style parity, auto-block checks, PageSpeed, push code + PRs

## Decision Point Before Execution

- [ ] **Switch to Execute mode** — required before Phase 0 can run (sitemap fetch, discovery scripts, and file writes are blocked in Plan mode).
- [ ] Confirm wave strategy (all-at-once vs Privat → Bedrift → Om oss) once the sitemap count is known.
- [ ] Decide whether to enable the **AEM Forms** plugin (`forms-excat`) if the tree contains interactive forms (Bli kunde, Meld skade, applications) needing Adaptive Form conversion rather than static markup — I can enable it on your confirmation.
