// backend/crawler.ts
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export interface HreflangTag {
    lang: string;
    url: string;
}

export interface SeoData {
    url: string;
    title: string;
    metaDescription: string;
    h1: string;
    h2s: string[];
    h3s: string[];
    navLinks: string[];       // first-level nav items (flat list)
    navMethod: 'schema' | 'dom-depth' | 'flat-fallback' | 'none';
    schemaMarkup: object[];
    hreflangTags: HreflangTag[];
    crawlMethod: 'fetch' | 'playwright' | 'failed';
    crawlError?: string;
}

// Realistic Chrome browser headers to avoid basic bot detection
const CHROME_HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
};

function hasUsefulData(data: Partial<SeoData>): boolean {
    return !!(data.title || data.h1 || (data.h2s && data.h2s.length > 0));
}

// ── Strategy 1: SiteNavigationElement JSON-LD ─────────────────────────────────

/**
 * Tries to extract first-level nav item names from JSON-LD SiteNavigationElement schema.
 * Returns null if schema is absent or has too few items.
 */
function extractNavFromSchema(schemaMarkup: object[]): string[] | null {
    type Node = Record<string, unknown>;

    // Flatten all JSON-LD blocks (handles @graph arrays and bare objects)
    const allNodes: Node[] = [];
    for (const block of schemaMarkup) {
        const b = block as Node;
        if (Array.isArray(b['@graph'])) allNodes.push(...(b['@graph'] as Node[]));
        else if (Array.isArray(block)) allNodes.push(...(block as Node[]));
        else allNodes.push(b);
    }

    // Find SiteNavigationElement nodes
    const navNodes = allNodes.filter(n => {
        const t = n['@type'];
        return Array.isArray(t) ? t.includes('SiteNavigationElement') : t === 'SiteNavigationElement';
    });

    if (navNodes.length === 0) return null;

    // Top-level items are those without a parentItem reference
    const topLevel = navNodes.filter(n => !n['parentItem']);

    // Fall back to all nodes if none have parentItem defined at all
    const source = topLevel.length > 0 ? topLevel : navNodes;

    const seen = new Set<string>();
    const links: string[] = [];
    for (const n of source) {
        const name = String(n['name'] || '').trim();
        if (name && name.length > 1 && name.length < 60 && !seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            links.push(name);
        }
    }

    if (links.length < 3) return null;
    console.log(`[nav] ✅ schema: ${links.length} items`);
    return links;
}

// ── Strategy 2: Primary nav + minimum DOM depth ───────────────────────────────

/**
 * Identifies the PRIMARY navigation element in the page.
 * Priority:
 *   1. nav inside <header>
 *   2. nav with aria-label hinting "main" / "global" / "primary" / "principal"
 *   3. nav with id/class hinting "main" / "primary"
 *   4. First <nav> in the document
 */
function findPrimaryNav($: cheerio.CheerioAPI): ReturnType<typeof $> | null {
    // 1. nav inside header
    const headerNav = $('header nav').first();
    if (headerNav.length) return headerNav;

    // 2. aria-label hints
    const ariaNav = $(
        'nav[aria-label*="main" i], nav[aria-label*="global" i], ' +
        'nav[aria-label*="primary" i], nav[aria-label*="principal" i]'
    ).first();
    if (ariaNav.length) return ariaNav;

    // 3. id / class hints
    const hintNav = $(
        'nav[id*="main"], nav[id*="primary"], nav[id*="globalnav"], ' +
        'nav[class*="main-nav"], nav[class*="primary-nav"]'
    ).first();
    if (hintNav.length) return hintNav;

    // 4. First nav in the document
    const firstNav = $('nav').first();
    if (firstNav.length) return firstNav;

    return null;
}

/**
 * Extracts first-level nav links from a given nav element.
 * Finds the minimum depth at which 3+ unique anchors appear — this is the
 * top-level nav row. If minimum depth only has 1-2 items (e.g., a logo link),
 * it progressively checks the next depth until finding a sufficient set.
 *
 * Depth is measured as ancestor-count between an <a> and the nav root.
 */
function extractMinDepthLinks(
    $: cheerio.CheerioAPI,
    navEl: ReturnType<typeof $>,
): string[] {
    const navRoot = navEl.get(0);
    if (!navRoot) return [];

    // Compute depth of each anchor relative to the nav root
    const entries: Array<{ depth: number; text: string }> = [];

    navEl.find('a').each((_, a) => {
        const text = $(a).text().trim().replace(/\s+/g, ' ');
        if (!text || text.length < 2 || text.length > 60) return;

        let depth = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = (a as any).parent;
        while (current && current !== navRoot) {
            depth++;
            current = current.parent;
        }
        entries.push({ depth, text });
    });

    if (entries.length === 0) return [];

    // Group items by depth and count unique items per depth
    const depthToUniqueItems = new Map<number, string[]>();
    for (const entry of entries) {
        if (!depthToUniqueItems.has(entry.depth)) {
            depthToUniqueItems.set(entry.depth, []);
        }
        const items = depthToUniqueItems.get(entry.depth)!;
        if (!items.some(it => it.toLowerCase() === entry.text.toLowerCase())) {
            items.push(entry.text);
        }
    }

    const availableDepths = Array.from(depthToUniqueItems.keys()).sort((a, b) => a - b);

    // Heuristic for selecting the "Best" depth
    // 1. We want the shallowest depth with at least 3 unique items.
    // 2. BUT we prefer a deeper depth if it has significantly more items (+3 or more)
    //    AND it still stays within a "reasonable" top-level menu size (e.g. <= 24 items).
    // This correctly skips small utility bars (Login/Cart) while avoiding over-extracting
    // massive mega-menus (all sub-categories).

    let bestDepth = availableDepths[0];
    let bestCount = depthToUniqueItems.get(bestDepth)!.length;

    for (let i = 0; i < availableDepths.length; i++) {
        const d = availableDepths[i];
        const items = depthToUniqueItems.get(d)!;

        // Find the first depth with at least 3 items
        if (items.length >= 3) {
            bestDepth = d;
            bestCount = items.length;

            // Look for a "significantly better" deeper depth
            for (let j = i + 1; j < availableDepths.length; j++) {
                const deeperD = availableDepths[j];
                if (deeperD > 12) break; // Don't look too deep

                const deeperItems = depthToUniqueItems.get(deeperD)!;
                // Prefer deeper if it has significantly more items, but isn't TOO large
                // (usually a top-level menu has < 25 items)
                if (deeperItems.length >= bestCount + 3 && deeperItems.length <= 24) {
                    bestDepth = deeperD;
                    bestCount = deeperItems.length;
                }
            }
            break;
        }
    }

    const finalLinks = depthToUniqueItems.get(bestDepth) || [];
    console.log(`[nav] ✅ dom-depth (best match at depth=${bestDepth}): ${finalLinks.length} items`);
    return finalLinks;
}

// ── Full nav extraction orchestrator ─────────────────────────────────────────

function extractNav(
    $: cheerio.CheerioAPI,
    schemaMarkup: object[],
): { navLinks: string[]; navMethod: SeoData['navMethod'] } {

    // Strategy 1: JSON-LD schema
    const schemaLinks = extractNavFromSchema(schemaMarkup);
    if (schemaLinks) return { navLinks: schemaLinks, navMethod: 'schema' };

    // Strategy 2: primary nav + min depth
    const primaryNav = findPrimaryNav($);
    if (primaryNav) {
        const links = extractMinDepthLinks($, primaryNav);
        if (links.length >= 3) return { navLinks: links, navMethod: 'dom-depth' };
    }

    // Flat fallback: all unique anchors in any nav/header
    console.log(`[nav] Using flat fallback`);
    const seen = new Set<string>();
    const links: string[] = [];
    $('nav a, header a, [role="navigation"] a').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 1 && text.length < 60 && !seen.has(text.toLowerCase())) {
            seen.add(text.toLowerCase());
            links.push(text);
        }
    });
    return { navLinks: links, navMethod: links.length > 0 ? 'flat-fallback' : 'none' };
}

// ── HTML extraction ───────────────────────────────────────────────────────────

function extractSeoFromHtml(html: string, url: string): Omit<SeoData, 'crawlMethod' | 'crawlError'> {
    const $ = cheerio.load(html);

    const title = $('title').first().text().trim();
    const metaDescription =
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        '';
    const h1 = $('h1').first().text().trim();
    const h2s = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    const h3s = $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean);

    // Schema markup
    const schemaMarkup: object[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const raw = $(el).html();
            if (raw) schemaMarkup.push(JSON.parse(raw));
        } catch { /* ignore malformed */ }
    });

    // Hreflang tags
    const hreflangTags: HreflangTag[] = [];
    $('link[rel="alternate"][hreflang]').each((_, el) => {
        const lang = $(el).attr('hreflang');
        const href = $(el).attr('href');
        if (lang && href) hreflangTags.push({ lang, url: href });
    });

    // Navigation
    const { navLinks, navMethod } = extractNav($, schemaMarkup);

    return { url, title, metaDescription, h1, h2s, h3s, navLinks, navMethod, schemaMarkup, hreflangTags };
}

// ── Crawl layers ──────────────────────────────────────────────────────────────

async function crawlWithFetch(url: string): Promise<SeoData | null> {
    try {
        const response = await fetch(url, {
            headers: CHROME_HEADERS,
            redirect: 'follow',
            signal: AbortSignal.timeout(10000),
        } as Parameters<typeof fetch>[1]);

        if (!response.ok) {
            console.log(`[fetch] HTTP ${response.status} for ${url}`);
            return null;
        }

        const html = await response.text();
        const data = extractSeoFromHtml(html, url);

        if (!hasUsefulData(data)) {
            console.log(`[fetch] Empty/blocked response for ${url}`);
            return null;
        }

        return { ...data, crawlMethod: 'fetch' };
    } catch (err) {
        console.log(`[fetch] Error for ${url}:`, (err as Error).message);
        return null;
    }
}

async function crawlWithPlaywright(url: string): Promise<SeoData> {
    const { chromium } = await import('playwright-extra');
    const stealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;
    chromium.use(stealthPlugin());

    const browser = await chromium.launch({
        headless: true,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
        ],
    });

    try {
        const context = await browser.newContext({
            userAgent: CHROME_HEADERS['User-Agent'],
            locale: 'es-ES',
            extraHTTPHeaders: { 'Accept-Language': CHROME_HEADERS['Accept-Language'] },
        });
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(1500);
        const html = await page.content();
        return { ...extractSeoFromHtml(html, url), crawlMethod: 'playwright' };
    } finally {
        await browser.close();
    }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function crawlUrl(url: string): Promise<SeoData> {
    console.log(`[crawler] Starting crawl for: ${url}`);

    const fetchResult = await crawlWithFetch(url);
    if (fetchResult) {
        console.log(`[crawler] ✅ fetch succeeded (nav: ${fetchResult.navMethod}, ${fetchResult.navLinks.length} items) for: ${url}`);
        return fetchResult;
    }

    console.log(`[crawler] 🔄 Switching to Playwright for: ${url}`);
    try {
        const result = await crawlWithPlaywright(url);
        console.log(`[crawler] ✅ Playwright succeeded (nav: ${result.navMethod}, ${result.navLinks.length} items) for: ${url}`);
        return result;
    } catch (err) {
        const errorMsg = (err as Error).message || 'Unknown error';
        console.error(`[crawler] ❌ Both methods failed for ${url}:`, errorMsg);
        return {
            url, title: '', metaDescription: '', h1: '',
            h2s: [], h3s: [], navLinks: [], navMethod: 'none',
            schemaMarkup: [], hreflangTags: [],
            crawlMethod: 'failed', crawlError: errorMsg,
        };
    }
}
