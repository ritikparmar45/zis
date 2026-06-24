# Shopify ZIP Code Pricing Theme Extension

This folder contains a Shopify Theme App Extension designed to be embedded directly into a merchant's theme layout.

## Structure

```
shopify-extension/
├── blocks/
│   └── zip-pricing.liquid     # Liquid app block template + settings schema
├── assets/
│   ├── zip-pricing.css        # Responsive, premium CSS styling
│   └── zip-pricing.js         # AJAX request logic & DOM pricing override
└── snippets/                  # Empty/Optional custom Liquid partials
```

## How It Works

1. **Targeting**: The block schema target is set to `"section"` (restricted to the `"product"` template). This means the merchant can add it as a standalone section or block inside the product layout on the page using the Shopify Theme Editor.
2. **Liquid Context**: The liquid template reads `product.id` dynamically from the active product page.
3. **Vanilla JS**: The Javascript file (`zip-pricing.js`) is loaded with a `defer` flag. It queries all elements on the page with the `.zip-pricing-container` class, collects input events, handles the backend query, and updates standard pricing classes (`.price-item--regular`, etc.) with the localized price resolved from the server.
4. **Theme Editor Settings**: Merchants can change the header title, input placeholders, button texts, colors, borders, and set the API backend URL directly through their Theme Customizer dashboard.
