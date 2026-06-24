/**
 * Price Controller
 * Handles calculating product pricing based on customer ZIP code.
 */

// Hardcoded pricing rules based on requirements
const PRICING_RULES = {
  '75028': 1499,
  '10001': 1699,
  '90210': 1799
};

const DEFAULT_PRICE = 1999;

/**
 * Calculates price for a given ZIP code and product ID
 * POST /api/price
 */
exports.calculatePrice = (req, res) => {
  try {
    const { zip, productId } = req.body;

    // 1. Validation: ZIP code is required
    if (!zip || typeof zip !== 'string' || zip.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'ZIP code is required.'
      });
    }

    // 2. Optional validation: Product ID
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required.'
      });
    }

    // Clean zip code (remove whitespace, standard format)
    const cleanZip = zip.trim();

    // 3. Determine price based on rules
    let price = PRICING_RULES[cleanZip];
    if (price === undefined) {
      price = DEFAULT_PRICE;
    }

    // Log the calculation for debugging/admin visibility
    const shopContext = req.shopify ? ` [Shop: ${req.shopify.shop}]` : '';
    console.log(`[Price Check]${shopContext} Product: ${productId}, ZIP: ${cleanZip} -> Resolved Price: $${price}`);

    // 4. Send successful response
    return res.status(200).json({
      success: true,
      price: price
    });

  } catch (error) {
    console.error('Error calculating price:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while calculating the price.'
    });
  }
};
