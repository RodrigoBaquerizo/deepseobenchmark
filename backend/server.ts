// backend/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import { crawlUrl } from './crawler';

const PORT = process.env.PORT || 3001;
const app = express();

// Soporte para múltiples orígenes (Local y Prod)
// Acepta localhost para desarrollo y cualquier subdominio de vercel.app para producción
app.use(cors({
    origin: (origin, callback) => {
        // Permitir peticiones sin origin (ej: Postman, curl)
        if (!origin) return callback(null, true);
        // Permitir localhost
        if (origin.startsWith('http://localhost')) return callback(null, true);
        // Permitir cualquier subdominio de vercel.app
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        // Permitir el dominio exacto configurado en FRONTEND_URL
        if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
        callback(new Error(`CORS: origin not allowed: ${origin}`));
    },
    credentials: true,
}));
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
