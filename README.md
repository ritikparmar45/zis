# Shopify ZIP Code-Based Product Pricing Demo

A complete, production-ready implementation of a Shopify ZIP Code-Based dynamic pricing solution. It enables merchants to display customized product prices to storefront users in real-time, matching local carrier zones, regional pricing policies, or promotions.

---

## 1. Project Overview

This project consists of two core components:
1. **Express Backend API (`backend/`)**: A Node.js service that handles ZIP code validation, applies regional pricing rules, and responds with custom prices.
2. **Shopify Theme App Extension (`shopify-extension/`)**: A frontend Liquid widget with Vanilla JS and Premium CSS that integrates directly into the Shopify product page, queries the API asynchronously, and dynamically updates storefront pricing without page reloads.

---

## 2. Architecture Diagram

```
       Customer Storefront (Shopify Product Page)
                         │
                         ▼ (Enters ZIP & clicks "Check Price")
               [zip-pricing.js (Frontend)]
                         │
                         ▼ (Sends Fetch POST Request with JSON payload)
           [POST /api/price to Express Backend]
                         │
                         ▼ (Executes calculatePrice controller logic)
               [Apply Pricing Rules]
                         │
                         ▼ (Returns HTTP 200 JSON Success Payload)
              [JSON response containing price]
                         │
                         ▼ (Intercepts and overrides storefront prices)
               Storefront updates price in DOM
```

---

## 3. Deliverables

This repository contains:
1. **Complete Express.js Backend**: Fully configured with environment handling, logging, validation, and CORS.
2. **Shopify Theme Extension App Block**: Complete Liquid template schema, assets (`zip-pricing.js`, `zip-pricing.css`) implementing micro-interactions, responsive form layout, and styling.
3. **Automated Testing Suite**: A controller unit testing verification runner (`verify-backend.js`) demonstrating correct response codes and rules execution.
4. **Detailed Installation, Deployment, & Execution Documentation**.

---

## 4. Setup Instructions

### Backend Setup

1. **Install Node.js & Dependencies**:
   Open a terminal in the `backend/` directory and run:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file inside the `backend/` directory (or use/modify the pre-configured one):
   ```env
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=*
   ```

3. **Start the Server**:
   For development with auto-reload (requires nodemon):
   ```bash
   npm run dev
   ```
   For production start:
   ```bash
   npm start
   ```
   The backend will start and listen on `http://localhost:5000`.

---

### Shopify Setup

To load this extension onto a live Shopify Storefront, you must packages it inside a Shopify App using the Shopify CLI.

#### Step 1: Create/Add to a Shopify App Project
If you have an existing Shopify CLI App project:
1. Copy the `shopify-extension/` directory into your Shopify app project as an extension directory named `extensions/zip-pricing-extension`.
2. Ensure you have a standard extension structure:
   ```
   extensions/zip-pricing-extension/
   ├── shopify.extension.toml
   ├── blocks/
   │   └── zip-pricing.liquid
   └── assets/
       ├── zip-pricing.css
       └── zip-pricing.js
   ```

#### Step 2: Deploy the Extension
1. From the root of your Shopify CLI app project, log in to your partner organization and deploy:
   ```bash
   shopify app deploy
   ```
2. Enable the extension version in your Shopify Partner Dashboard under **Apps > [Your App Name] > Extensions**.

#### Step 3: Add Widget to Product Page Template
1. Navigate to your Shopify Admin store page.
2. Click **Online Store > Themes > Customize** (for your active theme, e.g. Dawn).
3. Switch the page template at the top dropdown menu to **Products > Default product**.
4. In the left-hand sidebar menu, under **Product information**, click **Add block** or **Add section**.
5. Select the **ZIP Price Checker** block under the App Blocks list.
6. Drag and drop the block near the product price element.
7. Click the block to customize text settings (Heading, Subheading, placeholders, Button labels) and aesthetic colors (background, borders, button states). Set the **Backend API Endpoint URL** to your hosted backend (e.g. `https://your-backend-app.onrender.com/api/price`).
8. Click **Save** in the top right.

---

## 5. API Documentation

### `POST /api/price`

Calculates regional product prices according to the specified ZIP code.

#### Request Headers
`Content-Type: application/json`

#### Request Body Schema
```json
{
  "zip": "string (Required. The customer's ZIP code)",
  "productId": "string (Required. Shopify product ID)"
}
```

#### Response Success Schema (HTTP 200)
```json
{
  "success": true,
  "price": "number (Calculated price based on rules)"
}
```

#### Response Error Schema (HTTP 400 - Bad Request)
```json
{
  "success": false,
  "message": "Error description (e.g., 'ZIP code is required.')"
}
```

#### Rule Calculations
- **ZIP 75028** &rarr; `$1499`
- **ZIP 10001** &rarr; `$1699`
- **ZIP 90210** &rarr; `$1799`
- **Any other ZIP** &rarr; `$1999`

---

### Sample API Requests & Responses

#### Request (ZIP 75028)
```bash
curl -X POST http://localhost:5000/api/price \
  -H "Content-Type: application/json" \
  -d '{"zip": "75028", "productId": "gid://shopify/Product/12345678"}'
```
**Response:**
```json
{
  "success": true,
  "price": 1499
}
```

#### Request (General ZIP)
```bash
curl -X POST http://localhost:5000/api/price \
  -H "Content-Type: application/json" \
  -d '{"zip": "94103", "productId": "gid://shopify/Product/12345678"}'
```
**Response:**
```json
{
  "success": true,
  "price": 1999
}
```

#### Request (Error - Missing ZIP)
```bash
curl -X POST http://localhost:5000/api/price \
  -H "Content-Type: application/json" \
  -d '{"productId": "gid://shopify/Product/12345678"}'
```
**Response (HTTP 400):**
```json
{
  "success": false,
  "message": "ZIP code is required."
}
```

---

## 6. Testing Instructions

To run local manual validation commands without starting the browser:

### Using PowerShell (Windows)
```powershell
# Query for ZIP 75028
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/price" -ContentType "application/json" -Body '{"zip": "75028", "productId": "123"}'

# Query for ZIP 10001
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/price" -ContentType "application/json" -Body '{"zip": "10001", "productId": "123"}'

# Query for general ZIP (fallback)
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/price" -ContentType "application/json" -Body '{"zip": "85001", "productId": "123"}'
```

### Run Automated Unit Verification Test
You can run the built-in node script to verify controller logic directly. Run the following command:
```bash
node -e "require('./backend/controllers/priceController').calculatePrice({body:{zip:'75028',productId:'123'}}, {status:function(c){this.c=c;return this},json:function(d){console.log('Status:',this.c,'Data:',d)}})"
```

---

## 7. Deployment Instructions using Render

To host your backend API on **Render.com** (Free Web Service tier):

1. **Push Code to Git**: Create a new GitHub or GitLab repository containing this project and push the code.
2. **Log into Render**: Create or log in to your account at [Render.com](https://render.com).
3. **Create a New Web Service**:
   - In Render Dashboard, click **New +** and select **Web Service**.
   - Connect your GitHub repository.
   - Choose the branch you want to deploy (e.g. `main`).
4. **Configure Settings**:
   - **Name**: `shopify-zip-pricing-backend`
   - **Root Directory**: `backend` (or leave empty if repository root is the backend folder).
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Set Environment Variables**:
   Under the **Environment** tab on Render, add:
   - `PORT` = `10000` (Render will override this, but standard default works)
   - `NODE_ENV` = `production`
   - `CORS_ORIGIN` = `https://your-shopify-store-domain.myshopify.com` (Or `*` for testing, but listing your specific store domain is highly recommended for security).
6. **Deploy**: Click **Create Web Service**. Once deployed, Render will provide a public URL like `https://shopify-zip-pricing-backend.onrender.com`. Use this URL to configure the widget schema in your Shopify Theme Editor.

---

## 8. Screenshot Placeholders

Below are indicators of the widget lifecycle visual layouts.

### User Interface Block Layout
```
┌────────────────────────────────────────────────────────┐
│  Check Dynamic Price                                   │
│  Enter your ZIP code to see if local pricing applies.   │
│                                                        │
│  ┌───────────────────────┐  ┌─────────────┐            │
│  │ Enter ZIP Code        │  │ Check Price │            │
│  └───────────────────────┘  └─────────────┘            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Loading State
```
┌────────────────────────────────────────────────────────┐
│  Check Dynamic Price                                   │
│                                                        │
│  Checking price...                                     │
└────────────────────────────────────────────────────────┘
```

### Success (Updated Price Display)
```
┌────────────────────────────────────────────────────────┐
│  Check Dynamic Price                                   │
│                                                        │
│  [SPECIAL RATE AVAILABLE]                              │
│  Price for ZIP 75028: $1,499                           │
└────────────────────────────────────────────────────────┘
```

---

## 9. Time Taken
Approx. **2-3 Hours** (Setup, architecture design, server validation routes, Theme app block Liquid parameters, styling, JS storefront overrides, and documentation).
