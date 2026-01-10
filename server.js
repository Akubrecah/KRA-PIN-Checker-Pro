require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const BASE_URL = process.env.KRA_API_BASE_URL || 'https://sbx.kra.go.ke';

const KRA_CONFIG = {
    pinByID: {
        consumerKey: process.env.KRA_ID_CONSUMER_KEY,
        consumerSecret: process.env.KRA_ID_CONSUMER_SECRET,
        tokenEndpoint: `${BASE_URL}/v1/token/generate?grant_type=client_credentials`,
        pinCheckerEndpoint: `${BASE_URL}/checker/v1/pin`
    },
    pinByPIN: {
        consumerKey: process.env.KRA_PIN_CONSUMER_KEY,
        consumerSecret: process.env.KRA_PIN_CONSUMER_SECRET,
        tokenEndpoint: `${BASE_URL}/v1/token/generate?grant_type=client_credentials`,
        pinCheckerEndpoint: `${BASE_URL}/checker/v1/pinbypin`
    }
};

let tokenCache = {
    pinByID: { token: null, expiry: 0 },
    pinByPIN: { token: null, expiry: 0 }
};

async function getAccessToken(apiType, retries = 2) {
    const config = KRA_CONFIG[apiType];
    const cache = tokenCache[apiType];
    const now = Math.floor(Date.now() / 1000);

    if (cache.token && now < cache.expiry) {
        console.log(`[AUTH] Using cached token for ${apiType}`);
        return cache.token;
    }

    const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
    
    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        try {
            console.log(`[AUTH] Attempt ${i + 1} for ${apiType}: Fetching token from ${config.tokenEndpoint}...`);
            const response = await fetch(config.tokenEndpoint, {
                method: 'GET',
                headers: { 
                    'Authorization': `Basic ${credentials}`,
                    'User-Agent': 'Mozilla/5.0 (Node.js/KRA-Checker)',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeout);

            // Robust JSON handling
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                // Log the first 200 chars of HTML to debug
                console.error(`[AUTH] Failed: Received non-JSON response from KRA: ${text.substring(0, 200)}...`);
                throw new Error(`KRA Endpoint Verification Failed: Server returned ${response.status} ${response.statusText} (Not JSON)`);
            }

            const data = await response.json();
            if (!response.ok) throw new Error(data.errorMessage || 'Auth failed');

            cache.token = data.access_token;
            cache.expiry = now + parseInt(data.expires_in) - 60;
            console.log(`[AUTH] Token retrieved successfully for ${apiType}.`);
            return cache.token;
        } catch (error) {
            clearTimeout(timeout);
            const isTimeout = error.name === 'AbortError';
            console.error(`[AUTH] Attempt ${i + 1} for ${apiType} failed: ${isTimeout ? 'Request Timed Out' : error.message}`);
            
            if (i === retries) throw error;
            await new Promise(resolve => setTimeout(resolve, i * 1000 + 500));
        }
    }
}

app.post('/api/check-pin', async (req, res) => {
    try {
        const { taxpayerType, taxpayerID } = req.body;
        const config = KRA_CONFIG.pinByID;
        const token = await getAccessToken('pinByID');

        for (let i = 0; i <= 2; i++) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            try {
                console.log(`[CHECK-ID] Attempt ${i + 1}: PIN info for ${taxpayerID}`);
                const response = await fetch(config.pinCheckerEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'User-Agent': 'Mozilla/5.0 (Node.js/KRA-Checker)',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        TaxpayerType: taxpayerType,
                        TaxpayerID: taxpayerID
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeout);
                const data = await response.json();
                if (!response.ok) {
                    console.log(`[CHECK-ID] KRA returned error: ${JSON.stringify(data)}`);
                    return res.status(response.status).json(data);
                }
                console.log('[CHECK-ID] PIN info retrieved successfully.');
                return res.json(data);
            } catch (error) {
                clearTimeout(timeout);
                const isTimeout = error.name === 'AbortError';
                console.error(`[CHECK-ID] Attempt ${i + 1} failed: ${isTimeout ? 'Request Timed Out' : error.message}`);
                if (i === 2) throw error;
                await new Promise(resolve => setTimeout(resolve, i * 1000 + 500));
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ errorMessage: error.message });
    }
});

app.post('/api/check-pin-by-pin', async (req, res) => {
    try {
        const { kraPIN } = req.body;
        const config = KRA_CONFIG.pinByPIN;
        const token = await getAccessToken('pinByPIN');

        for (let i = 0; i <= 2; i++) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            try {
                console.log(`[CHECK-PIN] Attempt ${i + 1}: Data for ${kraPIN}`);
                const response = await fetch(config.pinCheckerEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'User-Agent': 'Mozilla/5.0 (Node.js/KRA-Checker)',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        KRAPIN: kraPIN
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeout);
                const data = await response.json();
                if (!response.ok) {
                    console.log(`[CHECK-PIN] KRA returned error: ${JSON.stringify(data)}`);
                    return res.status(response.status).json(data);
                }
                console.log('[CHECK-PIN] PIN info retrieved successfully.');
                return res.json(data);
            } catch (error) {
                clearTimeout(timeout);
                const isTimeout = error.name === 'AbortError';
                console.error(`[CHECK-PIN] Attempt ${i + 1} failed: ${isTimeout ? 'Request Timed Out' : error.message}`);
                if (i === 2) throw error;
                await new Promise(resolve => setTimeout(resolve, i * 1000 + 500));
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ errorMessage: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`KRA Multi-API Proxy Server running at http://localhost:${PORT}`);
});
