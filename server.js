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
                console.log(`[CHECK-ID] URL: ${config.pinCheckerEndpoint}`);
                console.log(`[CHECK-ID] Body: ${JSON.stringify({ TaxpayerType: taxpayerType, TaxpayerID: taxpayerID })}`);

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
                
                const rawText = await response.text();
                console.log(`[CHECK-ID] Raw Response Status: ${response.status}`);
                console.log(`[CHECK-ID] Raw Response Body: ${rawText.substring(0, 1000)}`); // Log first 1000 chars

                let data;
                try {
                    data = JSON.parse(rawText);
                } catch (e) {
                    console.error('[CHECK-ID] Failed to parse JSON response');
                    throw new Error('Invalid JSON response from KRA');
                }

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

// ============================================
// M-PESA PAYMENT ENDPOINTS
// ============================================

const mpesa = require('./mpesa');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin Client (for server-side operations)
const supabase = createClient(
    process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
    process.env.SUPABASE_SERVICE_KEY || 'YOUR_SUPABASE_SERVICE_KEY'
);

// Temporary storage for pending transactions (in production, use Redis or DB)
const pendingTransactions = new Map();

// Initiate M-PESA Payment
app.post('/api/pay', async (req, res) => {
    try {
        const { phoneNumber, amount, userId, type } = req.body;
        
        if (!phoneNumber || !amount || !userId || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Create transaction record in Supabase
        const { data: transaction, error: dbError } = await supabase
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
        
        if (dbError) {
            console.error('[PAY] DB Error:', dbError);
            return res.status(500).json({ error: 'Failed to create transaction record' });
        }
        
        // Initiate STK Push
        const accountRef = `KRAPIN-${transaction.id}`;
        const result = await mpesa.initiateSTKPush(
            phoneNumber,
            amount,
            accountRef,
            type === 'credit_purchase' ? 'PIN Check Credit' : 'Subscription Payment'
        );
        
        // Store mapping of checkoutRequestID to transaction
        pendingTransactions.set(result.checkoutRequestID, {
            transactionId: transaction.id,
            userId: userId,
            amount: amount,
            type: type
        });
        
        res.json({
            success: true,
            transactionId: transaction.id,
            checkoutRequestID: result.checkoutRequestID,
            message: 'Please check your phone for the M-PESA prompt'
        });
        
    } catch (error) {
        console.error('[PAY] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// M-PESA Callback Endpoint
app.post('/api/mpesa/callback', async (req, res) => {
    try {
        console.log('[MPESA CALLBACK] Received:', JSON.stringify(req.body, null, 2));
        
        const result = mpesa.handleCallback(req.body);
        const pending = pendingTransactions.get(result.checkoutRequestID);
        
        if (!pending) {
            console.warn('[MPESA CALLBACK] No pending transaction found for:', result.checkoutRequestID);
            return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
        }
        
        if (result.success) {
            // Update transaction status
            await supabase
                .from('transactions')
                .update({
                    status: 'completed',
                    mpesa_code: result.mpesaCode
                })
                .eq('id', pending.transactionId);
            
            // Update user credits or subscription
            if (pending.type === 'credit_purchase') {
                // Add credits (1 credit per 100 KES)
                const credits = Math.floor(pending.amount / 100);
                await supabase.rpc('add_credits', {
                    user_id: pending.userId,
                    credit_amount: credits
                });
                console.log(`[MPESA CALLBACK] Added ${credits} credits to user ${pending.userId}`);
            } else if (pending.type === 'subscription_monthly') {
                // Set subscription for 30 days
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 30);
                await supabase
                    .from('profiles')
                    .update({
                        subscription_status: 'active',
                        subscription_end: endDate.toISOString()
                    })
                    .eq('id', pending.userId);
                console.log(`[MPESA CALLBACK] Activated monthly subscription for user ${pending.userId}`);
            } else if (pending.type === 'subscription_weekly') {
                // Set subscription for 7 days
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 7);
                await supabase
                    .from('profiles')
                    .update({
                        subscription_status: 'active',
                        subscription_end: endDate.toISOString()
                    })
                    .eq('id', pending.userId);
                console.log(`[MPESA CALLBACK] Activated weekly subscription for user ${pending.userId}`);
            }
        } else {
            // Update transaction as failed
            await supabase
                .from('transactions')
                .update({ status: 'failed' })
                .eq('id', pending.transactionId);
            console.log(`[MPESA CALLBACK] Transaction ${pending.transactionId} failed: ${result.resultDesc}`);
        }
        
        // Clean up pending transaction
        pendingTransactions.delete(result.checkoutRequestID);
        
        res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (error) {
        console.error('[MPESA CALLBACK] Error:', error);
        res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
});

// Check Payment Status
app.get('/api/pay/status/:checkoutRequestID', async (req, res) => {
    try {
        const { checkoutRequestID } = req.params;
        const result = await mpesa.querySTKPushStatus(checkoutRequestID);
        res.json(result);
    } catch (error) {
        console.error('[PAY STATUS] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get User Credits
app.get('/api/user/:userId/credits', async (req, res) => {
    try {
        const { userId } = req.params;
        const { data, error } = await supabase
            .from('profiles')
            .select('credits, subscription_status, subscription_end, role')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        
        // Check if subscription is still active
        let subscriptionActive = false;
        if (data.subscription_status === 'active' && data.subscription_end) {
            subscriptionActive = new Date(data.subscription_end) > new Date();
            if (!subscriptionActive) {
                // Update expired subscription
                await supabase
                    .from('profiles')
                    .update({ subscription_status: 'expired' })
                    .eq('id', userId);
            }
        }
        
        res.json({
            credits: data.credits,
            subscriptionActive: subscriptionActive,
            subscriptionEnd: data.subscription_end,
            role: data.role
        });
    } catch (error) {
        console.error('[USER CREDITS] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Deduct Credit (called after successful PIN check)
app.post('/api/user/:userId/deduct-credit', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // First check if user has subscription or credits
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('credits, subscription_status, subscription_end, role')
            .eq('id', userId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Cyber users with active subscription don't need credits
        const subscriptionActive = profile.subscription_status === 'active' && 
            new Date(profile.subscription_end) > new Date();
        
        if (profile.role === 'cyber' && subscriptionActive) {
            return res.json({ success: true, message: 'Subscription active, no credit deducted' });
        }
        
        // Deduct credit for personal users
        if (profile.credits <= 0) {
            return res.status(403).json({ error: 'Insufficient credits' });
        }
        
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ credits: profile.credits - 1 })
            .eq('id', userId);
        
        if (updateError) throw updateError;
        
        res.json({ success: true, remainingCredits: profile.credits - 1 });
    } catch (error) {
        console.error('[DEDUCT CREDIT] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`KRA Multi-API Proxy Server running at http://localhost:${PORT}`);
});
