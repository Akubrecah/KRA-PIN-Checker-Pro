/**
 * KRA API Client
 * Calls the local proxy server to avoid CORS issues.
 */

async function checkPIN(taxpayerType, taxpayerID) {
    try {
        const response = await fetch('/api/check-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                taxpayerType: taxpayerType,
                taxpayerID: taxpayerID
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.ErrorMessage || data.errorMessage || 'Unknown error occurred');
        }

        return data;
    } catch (error) {
        console.error('Error in checkPIN:', error);
        throw error;
    }
}

async function checkPINByPIN(kraPIN) {
    try {
        const response = await fetch('/api/check-pin-by-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                kraPIN: kraPIN
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.Message || data.errorMessage || 'Invalid PIN or service error');
        }

        // Standardize the response structure for UI convenience
        if (data.PINDATA) {
            return {
                TaxpayerName: data.PINDATA.Name,
                TaxpayerPIN: data.PINDATA.KRAPIN,
                Type: data.PINDATA.TypeOfTaxpayer,
                Status: data.PINDATA.StatusOfPIN
            };
        }

        return data;
    } catch (error) {
        console.error('Error in checkPINByPIN:', error);
        throw error;
    }
}

// Export functions for use in UI
window.kraClient = {
    checkPIN,
    checkPINByPIN
};
