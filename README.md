# Saleator

Saleator is a Chrome extension (Manifest V3) for bidirectional cross-posting between Vinted and LeBonCoin. It extracts listing information and pre-fills the deposit forms on the target platform.

## Features

- **Bidirectional Cross-Posting**: Duplicate listings from Vinted to LeBonCoin, or from LeBonCoin to Vinted.
- **Bento Dashboard Side Panel**: A modern, rounded side panel UI built with Svelte 5 and Tailwind CSS v4.
- **Dark Mode Support**: Seamless toggle between light and dark themes.
- **Automated Extraction**: Reads title, description, price, condition, brand, size, and photo URLs from the active tab.
- **Photo Downloader & Injection**: Converts remote photo URLs into Blobs and injects them directly into file upload inputs.
- **Smart Mapping**: Maps categories and item conditions automatically between Vinted and LeBonCoin taxonomies.
- **Listing History**: Preserves recently extracted listings for quick reuse.

## Prerequisites

- **Node.js**: Version 22 or later.
- **pnpm**: Version 10 or later.
- **Google Chrome**: Or any Chromium-based browser supporting Manifest V3 Side Panel API.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/jeremyjousse/saleator.git
   cd saleator
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

## Development and Build

- Start development mode with hot module replacement:

  ```bash
  pnpm dev
  ```

- Build the production extension:

  ```bash
  pnpm build
  ```

  The built extension files are generated in `.output/chrome-mv3`.

- Run all verification checks (typecheck, lint, format check, tests):
  ```bash
  rtk mise run verify
  # or: pnpm check && pnpm lint && pnpm format:check && pnpm test
  ```

## Loading the Extension in Chrome

1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked**.
5. Select the `.output/chrome-mv3` folder inside the project directory.
6. Pin the **Saleator** extension icon to the browser toolbar.

## Usage Guide

### 1. Extract a Listing

1. Open any product listing on [Vinted](https://www.vinted.fr) or [LeBonCoin](https://www.leboncoin.fr).
2. Click the **Saleator** extension icon to open the Side Panel.
3. Verify the platform direction (e.g., **Vinted** as Source, **LeBonCoin** as Target). Click the toggle button to reverse direction if needed.
4. Click **Extraire depuis l'onglet actif**.
5. The extension parses the listing and displays its photos, title, price, and attributes in the Bento grid.

### 2. Review and Adjust Mapping

1. Check the target category and condition in the **Mapping & Attributs** card.
2. Adjust the category or price if desired.

### 3. Transfer to Target Platform (Multi-step Wizard)

LeBonCoin uses a step-by-step deposit wizard:

1. Click **Ouvrir le formulaire** (or open the target page).
2. **Step 1 (Title)**: Saleator fills the title. Click **Continuer**.
3. **Step 2 (Photos)**: The floating button automatically updates to **📸 Déposer les X photos** (or click **2. Photos** in the Side Panel). Saleator injects all photos into the dropzone. Click **Continuer**.
4. **Step 3 (Details & Price)**: The floating button updates to **📝 Remplir Description & Prix** (or click **3. Détails** in the Side Panel). Saleator fills the description and price.
5. Review your listing and submit when ready.

## Project Structure

```text
├── entrypoints/
│   ├── background.ts            # Extension service worker (SidePanel setup)
│   ├── vinted.content.ts        # Content script for Vinted
│   ├── leboncoin.content.ts     # Content script for LeBonCoin
│   └── sidepanel/               # Bento Dashboard UI (App.svelte, main.ts, style.css)
├── src/
│   ├── components/              # Svelte 5 UI components (BentoCard, ListingCard, etc.)
│   ├── services/                # Extractors, form fillers, mappings, storage, downloader
│   ├── types/                   # Zod schemas and TypeScript interfaces
│   └── utils/                   # Shared utility helpers (cn)
├── tests/                       # Unit and integration test suite
├── mise.toml                    # Standard task automation interface
└── wxt.config.ts                # WXT build and Manifest V3 configuration
```
