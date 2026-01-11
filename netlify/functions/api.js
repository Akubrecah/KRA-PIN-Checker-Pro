
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
// Note: We use the local mpesa.js we just created in step above
const mpesa = require('./mpesa');
const { createClient } = require('@supabase/supabase-js');
// native fetch is available in Node 18+ (Netlify default)

const app = express();
app.use(cors());
app.use(express.json());

// --- KRA CONFIG ---
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

// --- AUTH HELPER ---
async function getAccessToken(apiType) {
    const config = KRA_CONFIG[apiType];
    const cache = tokenCache[apiType];
    const now = Math.floor(Date.now() / 1000);

    if (cache.token && now < cache.expiry) return cache.token;

    const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
    
    // Simple fetch without abort controller complexity for lambda (timeouts managed by platform)
    try {
        const response = await fetch(config.tokenEndpoint, {
            method: 'GET',
            headers: { 
                'Authorization': `Basic ${credentials}`,
                'User-Agent': 'Mozilla/5.0 (Node.js/KRA-Checker)',
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.errorMessage || 'Auth failed');

        cache.token = data.access_token;
        cache.expiry = now + parseInt(data.expires_in) - 60;
        return cache.token;
    } catch (error) {
        console.error(`[AUTH] Failed: ${error.message}`);
        throw error;
    }
}

// --- API ROUTES ---
// IMPORTANT: Netlify rewrites /api/* to this function. 
// Express router will see the full path /api/check-pin unless we strip it.
// serverless-http usually passes the full path. We can use a router or just handle paths.
const router = express.Router();

router.post('/check-pin', async (req, res) => {
    try {
        const { taxpayerType, taxpayerID } = req.body;
        const config = KRA_CONFIG.pinByID;
        const token = await getAccessToken('pinByID');

        const response = await fetch(config.pinCheckerEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ TaxpayerType: taxpayerType, TaxpayerID: taxpayerID })
        });

        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        res.json(data);
    } catch (error) {
        res.status(500).json({ errorMessage: error.message });
    }
});

router.post('/check-pin-by-pin', async (req, res) => {
    try {
        const { kraPIN } = req.body;
        const config = KRA_CONFIG.pinByPIN;
        const token = await getAccessToken('pinByPIN');

        const response = await fetch(config.pinCheckerEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ KRAPIN: kraPIN })
        });

        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        res.json(data);
    } catch (error) {
        res.status(500).json({ errorMessage: error.message });
    }
});

// --- SUPABASE & PAYMENT ---
const supabase = createClient(
    process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
    process.env.SUPABASE_SERVICE_KEY || 'YOUR_SUPABASE_SERVICE_KEY'
);

// We need a way to persist pending transactions for callback. 
// Lambda is stateless. Using Supabase 'transactions' table is critical here.
// But we used a Map in server.js. Map won't work in Lambda.
// Ideally, the mpesa callback has an ID we can look up in DB. 
// CheckoutRequestID is in the callback. We can query the DB by that.
// The code below assumes we can write to 'transactions' table and read from it.

router.post('/pay', async (req, res) => {
    try {
        const { phoneNumber, amount, userId, type } = req.body;
        
        // Create DB record first
        const { data: transaction, error } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                amount: amount,
                type: type,
                phone_number: phoneNumber,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // Initiate STK
        const accountRef = `KRAPIN-${transaction.id}`;
        const result = await mpesa.initiateSTKPush(
            phoneNumber,
            amount,
            accountRef,
            type === 'credit_purchase' ? 'PIN Check Credit' : 'Subscription'
        );

        // Update DB with CheckoutRequestID so we can match callback
        await supabase
            .from('transactions')
            .update({ checkout_request_id: result.checkoutRequestID })
            .eq('id', transaction.id);

        res.json({
            success: true,
            transactionId: transaction.id,
            checkoutRequestID: result.checkoutRequestID,
            message: 'Check your phone for M-PESA prompt'
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

router.post('/mpesa/callback', async (req, res) => {
    try {
        const result = mpesa.handleCallback(req.body);
        
        // Find transaction by CheckoutRequestID (stored in DB now, assuming schema update)
        // If DB schema doesn't have checkout_request_id, we might have an issue.
        // Assuming user will migrate/update DB.
        
        const { data: transaction } = await supabase
            .from('transactions')
            .select('*')
            .eq('checkout_request_id', result.checkoutRequestID)
            .single();

        if (!transaction) {
            console.log('Transaction not found for ID:', result.checkoutRequestID);
            return res.json({ ResultCode: 0, ResultDesc: 'Accepted' }); 
        }

        if (result.success) {
            await supabase.from('transactions')
                .update({ status: 'completed', mpesa_code: result.mpesaCode })
                .eq('id', transaction.id);
            
            // Fulfillment logic (simplified)
            if (transaction.type === 'credit_purchase') {
                const credits = Math.floor(transaction.amount / 100);
                await supabase.rpc('add_credits', { user_id: transaction.user_id, credit_amount: credits });
            } else if (transaction.type.includes('subscription')) {
                const days = transaction.type.includes('weekly') ? 7 : 30;
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + days);
                await supabase.from('profiles')
                    .update({ subscription_status: 'active', subscription_end: endDate.toISOString() })
                    .eq('id', transaction.user_id);
            }
        } else {
             await supabase.from('transactions').update({ status: 'failed' }).eq('id', transaction.id);
        }

        res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (e) {
        console.error(e);
        res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
});

router.get('/pay/status/:checkoutRequestID', async (req, res) => {
    try {
        const result = await mpesa.querySTKPushStatus(req.params.checkoutRequestID);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// We mount the router at /api so it handles /api/check-pin matches
app.use('/api', router);

module.exports.handler = serverless(app);
