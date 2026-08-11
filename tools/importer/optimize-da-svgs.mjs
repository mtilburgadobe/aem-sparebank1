/* eslint-disable no-continue, no-restricted-syntax, no-await-in-loop, no-console */
// This is a Node CLI tool, not browser code: console output is its interface,
// and it deliberately processes DA assets sequentially (await-in-loop) to avoid
// hammering the admin API with parallel requests. The repo's shared eslintrc is
// browser-oriented (airbnb-base), so the rules disabled above do not apply here.

/*
 * optimize-da-svgs.mjs
 *
 * Post-import sweep that keeps SVG assets in the Document Authoring (DA) content
 * source under AEM's markdown-pipeline limit.
 *
 * WHY THIS EXISTS
 * ---------------
 * AEM's html2md pipeline (admin.hlx.page/preview) rejects any SVG larger than
 * 40KB with a 409 Conflict ("SVG is larger than 40KB"), which blocks the ENTIRE
 * page from previewing — not just the image. Source sites frequently ship
 * Illustrator-exported SVGs well above that. This tool finds every oversized SVG
 * in the DA content source, optimizes it losslessly with SVGO (multipass), and
 * re-uploads it in place so pages can preview.
 *
 * It is safe to run repeatedly: SVGs already under the limit are skipped, and an
 * optimized SVG that would not shrink below the limit is left untouched and
 * reported so a human can handle it (e.g. rasterize or redraw).
 *
 * USAGE
 * -----
 *   node tools/importer/optimize-da-svgs.mjs --org <org> --site <site> [options]
 *   npm run import:optimize-svgs -- --org <org> --site <site>
 *
 * If --org/--site are omitted, they are read from .migration/project.json
 * (previewOrg / previewSite of the active site in migration-work/profile.json,
 * falling back to the single configured site).
 *
 * OPTIONS
 *   --org <org>        DA org (owner). Default: from project config.
 *   --site <site>      DA site (repo). Default: from project config.
 *   --path <path>      Restrict the sweep to a subtree (e.g. /nb/bank). Default: / (whole site).
 *   --limit <kb>       Size limit in KB. Default: 40.
 *   --dry-run          Report what would change without uploading.
 *
 * AUTH
 *   No token needed here — credentials for admin.da.live are injected by the
 *   harness when the corresponding opt-in is enabled. If a request returns
 *   401/403, the opt-in is off (see project docs).
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
// svgo v4 uses an exports map that eslint-plugin-import can't resolve (works at runtime).
// eslint-disable-next-line import/no-unresolved
import { optimize } from 'svgo';

const DA_BASE = 'https://admin.da.live';
const DEFAULT_LIMIT_KB = 40;

/** Parse `--flag value` / `--flag` CLI args into a plain object. */
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

/** Resolve org/site from CLI args, falling back to .migration/project.json. */
async function resolveOrgSite(args, scriptDir) {
  if (args.org && args.site) return { org: args.org, site: args.site };

  const repoRoot = resolve(scriptDir, '..', '..');
  let projectType;
  let { org, site } = args;
  try {
    const project = JSON.parse(await readFile(resolve(repoRoot, '.migration/project.json'), 'utf8'));
    projectType = project.type;
    // Prefer the active site named in migration-work/profile.json, else the only site.
    let activeSite;
    try {
      const profile = JSON.parse(await readFile(resolve(repoRoot, 'migration-work/profile.json'), 'utf8'));
      activeSite = profile.site;
    } catch { /* profile optional */ }

    const sites = project.sites || {};
    const siteKey = activeSite && sites[activeSite] ? activeSite : Object.keys(sites)[0];
    const siteCfg = siteKey ? sites[siteKey] : undefined;
    if (siteCfg) {
      org = org || siteCfg.previewOrg;
      site = site || siteCfg.previewSite;
    }
  } catch {
    // project.json optional if org/site supplied on CLI
  }

  if (projectType && projectType !== 'da' && projectType !== 'doc') {
    // DA source API is used by both da and doc project types; other types
    // (e.g. xwalk) don't store assets in DA, so this sweep does not apply.
    console.warn(`⚠️  Project type is "${projectType}"; this SVG sweep targets Document Authoring sources. Continuing anyway because --org/--site can still point at a DA source.`);
  }

  if (!org || !site) {
    throw new Error('Could not resolve org/site. Pass --org <org> --site <site> or add them to .migration/project.json.');
  }
  return { org, site };
}

/** GET JSON from the DA list API. Returns [] for a missing/empty folder. */
async function listFolder(org, site, path) {
  const clean = path.replace(/^\/+|\/+$/g, '');
  const url = `${DA_BASE}/list/${org}/${site}${clean ? `/${clean}` : ''}`;
  const res = await fetch(url);
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`list ${url} → ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  return Array.isArray(body) ? body : [];
}

/**
 * Recursively collect every entry under `startPath`.
 * DA `/list` returns folders (no `ext`) and files (with `ext`).
 * Returns file entries only, each { path, name, ext }.
 */
async function collectFiles(org, site, startPath, seen = new Set()) {
  const files = [];
  const entries = await listFolder(org, site, startPath);
  for (const entry of entries) {
    if (entry.ext !== undefined) {
      files.push(entry);
    } else if (entry.path && !seen.has(entry.path)) {
      seen.add(entry.path);
      // entry.path is /<org>/<site>/<subpath>; strip the /<org>/<site> prefix.
      const sub = entry.path.replace(new RegExp(`^/${org}/${site}`), '');
      files.push(...await collectFiles(org, site, sub, seen));
    }
  }
  return files;
}

/**
 * DA hides per-document asset folders (named `.<docname>`) from the parent
 * listing, so recursion alone misses imported images. For every `<name>.html`
 * document we also probe its sibling `.<name>` asset folder.
 */
async function collectHiddenAssetFiles(org, site, htmlFiles) {
  const files = [];
  for (const doc of htmlFiles) {
    // doc.path: /<org>/<site>/<dir>/<name>.html  → hidden folder /<dir>/.<name>
    const sub = doc.path.replace(new RegExp(`^/${org}/${site}`), '');
    const dir = dirname(sub);
    const hidden = `${dir === '/' ? '' : dir}/.${doc.name}`;
    const entries = await listFolder(org, site, hidden);
    for (const entry of entries) {
      if (entry.ext !== undefined) files.push(entry);
    }
  }
  return files;
}

/** Fetch raw SVG bytes for a DA source file entry. */
async function fetchSource(org, site, entry) {
  const sub = entry.path.replace(new RegExp(`^/${org}/${site}`), '');
  const url = `${DA_BASE}/source/${org}/${site}${sub}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status} ${res.statusText}`);
  return { url, text: await res.text() };
}

/** Re-upload optimized SVG bytes to its DA source path. */
async function uploadSource(sourceUrl, svgText) {
  const form = new FormData();
  form.append('data', new Blob([svgText], { type: 'image/svg+xml' }), 'image.svg');
  const res = await fetch(sourceUrl, { method: 'POST', body: form });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`upload ${sourceUrl} → ${res.status} ${res.statusText} ${detail}`.trim());
  }
}

const bytesOf = (str) => Buffer.byteLength(str, 'utf8');
const kb = (bytes) => (bytes / 1024).toFixed(1);

async function main() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const args = parseArgs(process.argv.slice(2));
  const { org, site } = await resolveOrgSite(args, scriptDir);
  const startPath = typeof args.path === 'string' ? args.path : '/';
  const limitKb = Number(args.limit) > 0 ? Number(args.limit) : DEFAULT_LIMIT_KB;
  const limitBytes = limitKb * 1024;
  const dryRun = Boolean(args['dry-run']);

  console.log(`SVG optimization sweep — ${org}/${site}`);
  console.log(`  Scope: ${startPath}   Limit: ${limitKb}KB   ${dryRun ? '(dry run)' : ''}`);

  // 1. Enumerate every file in scope, including hidden per-document asset folders.
  const visible = await collectFiles(org, site, startPath);
  const htmlDocs = visible.filter((f) => f.ext === 'html');
  const hidden = await collectHiddenAssetFiles(org, site, htmlDocs);

  // De-dupe by path (a file could appear in both passes).
  const byPath = new Map();
  [...visible, ...hidden].forEach((f) => byPath.set(f.path, f));
  const svgs = [...byPath.values()].filter((f) => (f.ext || '').toLowerCase() === 'svg');

  console.log(`  Found ${svgs.length} SVG file(s) in scope.\n`);

  const results = {
    optimized: [], skipped: [], stillOver: [], errors: [],
  };

  for (const entry of svgs) {
    const label = entry.path.replace(`/${org}/${site}`, '');
    try {
      const { url, text } = await fetchSource(org, site, entry);
      const originalBytes = bytesOf(text);

      if (originalBytes <= limitBytes) {
        results.skipped.push({ label, kb: kb(originalBytes) });
        continue;
      }

      const { data: optimized } = optimize(text, {
        multipass: true,
        // SVGO v4 removed `removeViewBox` from preset-default and no longer
        // strips the viewBox by default, so preset-default alone preserves it.
        // Keeping the viewBox is essential — removing it breaks the responsive
        // scaling blocks rely on.
        plugins: ['preset-default'],
      });
      const optimizedBytes = bytesOf(optimized);

      if (optimizedBytes > limitBytes) {
        results.stillOver.push({
          label, from: kb(originalBytes), to: kb(optimizedBytes),
        });
        continue;
      }
      if (optimizedBytes >= originalBytes) {
        // Already minimal; nothing to gain (but it was under limit → handled above,
        // so reaching here means it's over-limit yet uncompressible).
        results.stillOver.push({
          label, from: kb(originalBytes), to: kb(optimizedBytes),
        });
        continue;
      }

      if (!dryRun) {
        await uploadSource(url, optimized);
      }
      results.optimized.push({
        label, from: kb(originalBytes), to: kb(optimizedBytes),
      });
    } catch (err) {
      results.errors.push({ label, message: err.message });
    }
  }

  // Report
  console.log('── Results ─────────────────────────────────');
  if (results.optimized.length) {
    console.log(`✅ Optimized ${results.optimized.length} SVG(s)${dryRun ? ' (dry run — not uploaded)' : ''}:`);
    results.optimized.forEach((r) => console.log(`   ${r.from}KB → ${r.to}KB  ${r.label}`));
  }
  if (results.stillOver.length) {
    console.log(`⚠️  ${results.stillOver.length} SVG(s) still over ${limitKb}KB after optimization (need manual handling — rasterize or redraw):`);
    results.stillOver.forEach((r) => console.log(`   ${r.from}KB → ${r.to}KB  ${r.label}`));
  }
  if (results.errors.length) {
    console.log(`❌ ${results.errors.length} error(s):`);
    results.errors.forEach((r) => console.log(`   ${r.label}: ${r.message}`));
  }
  console.log(`   ${results.skipped.length} SVG(s) already under limit — skipped.`);
  console.log('────────────────────────────────────────────');

  // Non-zero exit if anything remains broken so callers/CI can detect it.
  if (results.errors.length || results.stillOver.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exitCode = 1;
});
