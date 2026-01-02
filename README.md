# KRA PIN Checker Pro

A professional, hybrid web application for KRA PIN verification and Tax Compliance Certificate generation. This project combines a lightweight Vanilla JS frontend for immediate deployment with a robust React/Vite development environment for the PDF generation engine.

<div align="center">

![PDF Certificate Preview](/assets/test.png)

</div>
<!-- *(Replace with actual screenshot if available)* -->

## 🚀 Features

### Core Functionality
- **PIN Verification**: Instantly validate KRA PINs and retrieve associated taxpayer details (Name, Address, Station).
- **Certificate Generation**: Create official-looking, A4-sized KRA PIN Certificates.
- **Standalone PDF Engine**: Uses `html2pdf.js` for reliable, client-side PDF generation without server overhead.
- **Responsive Design**: Modern, mobile-responsive UI with a clean aesthetic.

### Technical Highlights
- **Hybrid Architecture**: 
  - **Production**: Vanilla HTML/JS/CSS (`index.html`) for zero-build deployment.
  - **Development**: React + Vite (`src/`) for component-based development of complex UI parts.
- **Dynamic Preview**: Real-time certificate preview updates as you type.
- **Smart Layout**: Enforced A4 dimensions ensuring perfect single-page printing.

## 📂 Project Structure

This repository uses a flat hybrid structure:

| File/Folder | Description |
|---|---|
| **`index.html`** | **The Main App**. Open this to run the PIN Checker immediately. No build steps. |
| **`style.css`** | Styles for the main application. |
| **`kra_api.js`** | Logic for mocking/fetching KRA API data. |
| `src/` | React source code for the PDF generator component (Development). |
| `index.react.html` | Entry point for the React development server. |
| `vite.config.ts` | Configuration for the Vite build tool. |

## 🛠️ Getting Started

### Method 1: Quick Start (Vanilla JS)
**Use this for the main application.**
1. Clone the repository:
   ```bash
   git clone https://github.com/Akubrecah/KRA-PIN-Checker-Pro.git
   ```
2. Navigate to the folder:
   ```bash
   cd KRA-PIN-Checker-Pro
   ```
3. Open `index.html` in your browser.
   - on Linux/Mac: `open index.html`
   - on Windows: `start index.html`

### Method 2: Developer Mode (React/Vite)
**Use this if you want to modify the PDF generator logic.**
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the link provided in the terminal (usually `http://localhost:5173`).

## ⚙️ Configuration

- **API Endpoints**: The application uses a local proxy server (`server.js`) to handle CORS and authentication with the KRA sandbox.
- **Environment Variables**: You must create a `.env` file in the root directory with your KRA credentials:
  ```env
  KRA_ID_CONSUMER_KEY=your_key_here
  KRA_ID_CONSUMER_SECRET=your_secret_here
  KRA_PIN_CONSUMER_KEY=your_key_here
  KRA_PIN_CONSUMER_SECRET=your_secret_here
  PORT=3000
  ```
- **PDF Settings**: Layout constraints are defined in `style.css` under `#certificate-container`.

### Running the Proxy Server
To use the live API verification:
1. Ensure `.env` is configured.
2. Run the server:
   ```bash
   node server.js
   ```
3. The frontend (`index.html`) is configured to talk to `http://localhost:3000`.

## 🤝 Contributing

1. Fork the repository.
2. Create settings feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## ⚠️ Disclaimer
This tool is for educational and testing purposes only. It is not affiliated with the Kenya Revenue Authority. Generated certificates are **molds/previews** and not legal documents.
