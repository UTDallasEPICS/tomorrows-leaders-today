import { grantScraper } from './src/library/grantScraper.js';

export default async function handler(req, res) {
    const { url } = req.query; // Expecting a URL parameter
    if (!url) {
        return res.status(400).json({ error: 'Missing URL parameter' });
    }

    try {
        const grants = await grantScraper(url);
        res.status(200).json( { grants } );
    }

    catch (error) {
        res.status(500).json({ error: 'Scraping failed' });
    }
}