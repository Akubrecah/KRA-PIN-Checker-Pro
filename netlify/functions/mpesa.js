// netlify/functions/mpesa.js
// COPY of mpesa.js adapted for Netlify (environment variables usually same)

const MPESA_CONFIG = {
    CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
    CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
    SHORTCODE: process.env.MPESA_SHORTCODE || '174379',
    PASSKEY: process.env.MPESA_PASSKEY,
    CALLBACK_URL: process.env.MPESA_CALLBACK_URL,
    ENV: process.env.MPESA_ENV || 'sandbox'
};

const MPESA_URLS = {
    sandbox: {
        oauth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        stkpush: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        query: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
    },
    production: {
        oauth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        stkpush: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        query: 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
    }
};

let accessToken = null;
let tokenExpiry = null;

function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
}

function generatePassword(shortcode, passkey, timestamp) {
    const data = shortcode + passkey + timestamp;
    return Buffer.from(data).toString('base64');
}

function formatPhoneNumber(phone) {
    let cleaned = phone.replace(/[\s\-\+]/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
        cleaned = '254' + cleaned;
    }
    return cleaned;
}

async function getAccessToken() {
    if (accessToken && tokenExpiry && new Date() < tokenExpiry) {
        return accessToken;
    }
    
    const auth = Buffer.from(
        `${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`
    ).toString('base64');
    
    const urls = MPESA_URLS[MPESA_CONFIG.ENV];
    
    try {
        const response = await fetch(urls.oauth, {
            method: 'GET',
            headers: { 'Authorization': `Basic ${auth}` }
        });
        
        if (!response.ok) throw new Error(`Failed to get M-PESA access token`);
        
        const data = await response.json();
        accessToken = data.access_token;
        tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
        return accessToken;
    } catch (error) {
        console.error("M-PESA Auth Error:", error);
        throw error;
    }
}

async function initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
    const token = await getAccessToken();
    const urls = MPESA_URLS[MPESA_CONFIG.ENV];
    const timestamp = getTimestamp();
    const password = generatePassword(MPESA_CONFIG.SHORTCODE, MPESA_CONFIG.PASSKEY, timestamp);
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const payload = {
        BusinessShortCode: MPESA_CONFIG.SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: MPESA_CONFIG.SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: MPESA_CONFIG.CALLBACK_URL,
        AccountReference: accountReference || 'KRAPINChecker',
        TransactionDesc: transactionDesc || 'PIN Check Payment'
    };
    
    const response = await fetch(urls.stkpush, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    if (data.ResponseCode === '0') {
        return {
            success: true,
            checkoutRequestID: data.CheckoutRequestID,
            merchantRequestID: data.MerchantRequestID
        };
    } else {
        throw new Error(data.errorMessage || data.ResponseDescription || 'STK Push failed');
    }
}

async function querySTKPushStatus(checkoutRequestID) {
    const token = await getAccessToken();
    const urls = MPESA_URLS[MPESA_CONFIG.ENV];
    const timestamp = getTimestamp();
    const password = generatePassword(MPESA_CONFIG.SHORTCODE, MPESA_CONFIG.PASSKEY, timestamp);
    
    const payload = {
        BusinessShortCode: MPESA_CONFIG.SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
    };
    
    const response = await fetch(urls.query, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    return {
        success: data.ResultCode === '0',
        resultCode: data.ResultCode,
        resultDesc: data.ResultDesc
    };
}

function handleCallback(callbackData) {
    const { Body } = callbackData;
    const { stkCallback } = Body;
    
    const result = {
        merchantRequestID: stkCallback.MerchantRequestID,
        checkoutRequestID: stkCallback.CheckoutRequestID,
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc,
        success: stkCallback.ResultCode === 0
    };
    
    if (result.success && stkCallback.CallbackMetadata) {
        const metadata = stkCallback.CallbackMetadata.Item;
        for (const item of metadata) {
            if (item.Name === 'Amount') result.amount = item.Value;
            if (item.Name === 'MpesaReceiptNumber') result.mpesaCode = item.Value;
            if (item.Name === 'PhoneNumber') result.phoneNumber = item.Value;
        }
    }
    return result;
}

module.exports = {
    initiateSTKPush,
    querySTKPushStatus,
    handleCallback,
    MPESA_CONFIG
};
