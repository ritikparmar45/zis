const crypto = require('crypto');

/**
 * Express middleware to verify the HMAC signature of requests routed through Shopify App Proxy.
 */
module.exports = (req, res, next) => {
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  // 1. If no secret is configured, warn and bypass verification to support local testing & demo setup.
  if (!apiSecret) {
    console.warn('[ZIP Pricing Backend] Warning: SHOPIFY_API_SECRET is not configured in .env. App Proxy signature verification is bypassed.');
    return next();
  }

  const { signature, ...params } = req.query;

  // 2. Ensure signature parameter is present
  if (!signature) {
    console.error('[ZIP Pricing Backend] Blocked request: Missing signature in query params.');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing Shopify App Proxy verification signature.'
    });
  }

  // 3. Verify timestamp freshness (allow a window of 10 minutes to prevent replay attacks)
  const timestamp = parseInt(params.timestamp, 10);
  const currentTime = Math.floor(Date.now() / 1000);

  if (isNaN(timestamp) || Math.abs(currentTime - timestamp) > 600) {
    console.error(`[ZIP Pricing Backend] Blocked request: Invalid or expired timestamp (${timestamp}). Current: ${currentTime}`);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Request signature has expired or is invalid.'
    });
  }

  try {
    // 4. Sort query parameter keys lexicographically and construct the concatenated string
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => {
        const val = Array.isArray(params[key]) ? params[key].join(',') : params[key];
        return `${key}=${val}`;
      })
      .join('');

    // 5. Generate HMAC-SHA256 hash using the Shopify API Secret
    const calculatedSignature = crypto
      .createHmac('sha256', apiSecret)
      .update(sortedParams, 'utf-8')
      .digest('hex');

    // 6. Perform timing-attack safe comparison (avoid throwing if lengths differ)
    if (typeof signature !== 'string' || signature.length !== 64 || calculatedSignature.length !== 64) {
      console.error('[ZIP Pricing Backend] Blocked request: Signature length mismatch.');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid Shopify signature.'
      });
    }

    const isAuthentic = crypto.timingSafeEqual(
      Buffer.from(calculatedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );

    if (!isAuthentic) {
      console.error('[ZIP Pricing Backend] Blocked request: Signature mismatch.');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid Shopify signature.'
      });
    }

    // Attach Shopify request context for logging/downstream controllers
    req.shopify = {
      shop: params.shop,
      pathPrefix: params.path_prefix
    };

    next();
  } catch (error) {
    console.error('[ZIP Pricing Backend] Signature verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Signature verification failed.'
    });
  }
};
