// backend/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import { crawlUrl } from './crawler';

const PORT = process.env.PORT || 3001;
const app = express();

// Soporte para múltiples orígenes (Local y Prod)
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL // Se configurará en Railway
].filter(Boolean) as string[];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

// Main crawl endpoint
app.post('/api/crawl', async (req: Request, res: Response) => {
    const { url } = req.body as { url?: string };

    if (!url || typeof url !== 'string' || !url.trim()) {
        res.status(400).json({ error: 'URL is required' });
        return;
    }

    // Basic URL validation
    try {
        new URL(url);
    } catch {
        res.status(400).json({ error: `Invalid URL: ${url}` });
        return;
    }

    try {
        const seoData = await crawlUrl(url.trim());
        res.json(seoData);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error';
        console.error('[server] Error crawling URL:', message);
        res.status(500).json({ error: message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SEO Crawler backend running at http://localhost:${PORT}`);
});
