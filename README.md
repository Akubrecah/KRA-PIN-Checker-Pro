# KRA PIN Checker Pro - Playful Brutalism Pivot

A high-end, developer-first tool for KRA PIN verification and Tax Compliance Certificate generation, now featuring a **"Playful Brutalism"** design system.

<div align="center">

![Bento Grid Preview](./bento_grid_preview.png)
*(Note: Replace with actual screenshot path)*

</div>

## 🎨 Design Philosophy: Playful Brutalism
This project successfully pivoted to a bold new aesthetic:
-   **Palette**: Vibrant Coral Orange (`#F66C40`) & Soft Periwinkle Blue (`#8EAEED`).
-   **Typography**: Massive, geometric `Inter` headings against clean sans-serif body text.
-   **Layout**: Asymmetrical **Bento Grids**, rounded "Squipple" corners, and organic shapes.
-   **Interaction**: Premium "Webflow-style" animations (Marquee, hover scales, smooth scrolls).

## 🚀 Key Features

### 1. Instant Verification Scanner
-   Direct integration with KRA Sandbox API.
-   Validates PINs (e.g., `P000000000X`) in milliseconds.
-   Retrieves Taxpayer Name, Station, and Obligation details.

### 2. High-Fidelity PDF Generation
-   Generates print-ready **A4 Tax Compliance Certificates**.
-   Client-side rendering using `html2pdf.js` (Zero server overhead).
-   Perfect alignment with Official KRA 2026 templates.

## 🚀 How to Run

### Prerequisite
- Node.js installed (v16 or higher)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
The project comes with a `.env` file. By default, it is configured for the **KRA Sandbox**.
To switch to Production, update `KRA_API_BASE_URL` in `.env` to the correct production endpoint.

### 3. Start the Server
```bash
node server.js
```
The server will start at `http://localhost:3000`.

### 4. Access the App
Open your browser and visit:
[http://localhost:3000](http://localhost:3000)

---

### 3. Monetization & Access Control
-   **Authentication**: Multi-role support (Personal vs. Cyber/Business).
-   **Pay-Per-Use**: Micro-transaction simulation for Personal users (100 KES/check).
-   **Subscriptions**: Weekly/Monthly plans for high-volume Cyber users.
-   **Feature Gating**: Smart locking of scanner features based on user credits.

## 📂 Project Structure

| File | Description |
|---|---|
| **`index.html`** | The core application. Contains the new Hero, Bento Grid, and Scanner tool. |
| **`style.css`** | The **Design System**. Defines the Playful Brutalism variables, grids, and animations. |
| **`auth.js`** | Handles User Roles, Mock Payments, and Feature Gating logic. |
| **`kra_api.js`** | Logic for mocking/fetching KRA API data. |

## 🛠️ Usage

1.  **Clone & Run**:
    ```bash
    git clone https://github.com/Akubrecah/KRA-PIN-Checker-Pro.git
    cd KRA-PIN-Checker-Pro
    # No build required. Just open index.html
    open index.html
    ```

2.  **Authentication Flow**:
    -   Click **"Login"**.
    -   Select **"Register"** -> **"Personal User"**.
    -   Key in any dummy email/password.
    -   Attempt a scan -> **Pay 100 KES** (Simulation) -> **Success**.

## ⚙️ Configuration (Optional)
Create a `.env` file for backend proxy usage (if running `server.js`):
```env
KRA_PIN_CONSUMER_KEY=your_key
KRA_PIN_CONSUMER_SECRET=your_secret
```

## ⚠️ Disclaimer
This tool is for educational purposes. Generated certificates are previews, not legal documents.
