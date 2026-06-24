/**
 * Shopify ZIP Code Product Pricing Script
 * Handles input collection, backend API querying, and storefront price updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all instances of the ZIP pricing widget on the page
  const widgets = document.querySelectorAll('.zip-pricing-container');
  
  widgets.forEach(widget => {
    initZipPricingWidget(widget);
  });
});

/**
 * Initializes a single widget instance
 * @param {HTMLElement} widget - The container element for the ZIP pricing widget
 */
function initZipPricingWidget(widget) {
  const productId = widget.getAttribute('data-product-id');
  const apiUrl = widget.getAttribute('data-api-url') || 'http://localhost:5000/api/price';
  
  // Find widget-scoped elements
  const widgetId = widget.id;
  const blockIdSuffix = widgetId.replace('zip-pricing-', '');
  
  const zipInput = widget.querySelector(`#zip-input-${blockIdSuffix}`);
  const checkBtn = widget.querySelector(`#zip-button-${blockIdSuffix}`);
  const loadingState = widget.querySelector(`#zip-loading-${blockIdSuffix}`);
  const successState = widget.querySelector(`#zip-success-${blockIdSuffix}`);
  const errorState = widget.querySelector(`#zip-error-${blockIdSuffix}`);
  
  const resolvedZipSpan = widget.querySelector('.zip-resolved-zip');
  const resolvedPriceSpan = widget.querySelector('.zip-resolved-price');
  const errorTextSpan = widget.querySelector('.zip-error-text');

  if (!zipInput || !checkBtn) {
    console.error('[ZIP Pricing] Essential widget controls missing in DOM.', { widgetId });
    return;
  }

  // Bind click event
  checkBtn.addEventListener('click', handleCheckPrice);

  // Bind Enter key press inside input
  zipInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCheckPrice();
    }
  });

  // Keep a reference of the original price text to reset if needed
  let originalThemePriceText = null;

  /**
   * Performs price checking operations
   */
  async function handleCheckPrice() {
    const rawZip = zipInput.value;
    const cleanZip = rawZip ? rawZip.trim() : '';

    // Reset previous states
    hideElement(successState);
    hideElement(errorState);
    hideElement(loadingState);

    // Front-end Validation
    if (!cleanZip) {
      showError('Please enter a ZIP code.');
      return;
    }

    if (cleanZip.length < 3) {
      showError('ZIP code is too short. Please check and try again.');
      return;
    }

    // Activate loading state
    setLoading(true);

    try {
      const payload = {
        zip: cleanZip,
        productId: productId
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Error code ${response.status} received from pricing service.`);
      }

      // Success sequence
      showPrice(cleanZip, data.price);

    } catch (err) {
      console.error('[ZIP Pricing] API Request failed:', err);
      showError(err.message || 'Unable to fetch local pricing. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Formats numbers as USD currency
   * @param {number} amount - Numerical value (e.g. 1499)
   * @returns {string} - Formatted currency (e.g. $1,499.00)
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Updates UI to present the calculated price
   */
  function showPrice(zip, price) {
    const formattedPrice = formatCurrency(price);

    // Update block text
    if (resolvedZipSpan) resolvedZipSpan.textContent = zip;
    if (resolvedPriceSpan) resolvedPriceSpan.textContent = formattedPrice;
    
    showElement(successState);

    // Attempt to update standard storefront price elements
    updateStorefrontThemePrice(formattedPrice);
  }

  /**
   * Displays validation or network error messages
   */
  function showError(message) {
    if (errorTextSpan) errorTextSpan.textContent = message;
    showElement(errorState);
  }

  /**
   * Updates or resets active CSS classes for loading indicator
   */
  function setLoading(isLoading) {
    if (isLoading) {
      checkBtn.classList.add('zip-loading');
      checkBtn.disabled = true;
      zipInput.disabled = true;
      showElement(loadingState);
    } else {
      checkBtn.classList.remove('zip-loading');
      checkBtn.disabled = false;
      zipInput.disabled = false;
      hideElement(loadingState);
    }
  }

  /**
   * Helper functions to toggle visibility
   */
  function showElement(el) {
    if (el) el.classList.remove('zip-hidden');
  }

  function hideElement(el) {
    if (el) el.classList.add('zip-hidden');
  }

  /**
   * Scans document for typical storefront price elements and overrides their values
   */
  function updateStorefrontThemePrice(newPriceHtml) {
    // Selectors covering Dawn and many common Shopify themes
    const selectors = [
      '.price-item--regular',
      '.price-item--sale',
      '.product__price .price-item',
      '.price__container .price-item',
      '#price-regular .price-item',
      '.modal__layout .price-item',
      '.product-single__price'
    ];

    let updatedCount = 0;

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // Record original content if not recorded already
        if (!originalThemePriceText) {
          originalThemePriceText = element.textContent;
        }
        element.textContent = newPriceHtml;
        updatedCount++;
      });
    });

    if (updatedCount > 0) {
      console.log(`[ZIP Pricing] Overrode ${updatedCount} storefront price elements with ${newPriceHtml}`);
    }
  }
}
