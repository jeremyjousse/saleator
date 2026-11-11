import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'Saleator',
    description: 'Cross-post listings bi-directionally between Vinted and LeBonCoin',
    permissions: ['sidePanel', 'storage', 'activeTab', 'tabs', 'scripting'],
    host_permissions: [
      '*://*.vinted.fr/*',
      '*://*.vinted.com/*',
      '*://*.vinted.es/*',
      '*://*.vinted.it/*',
      '*://*.vinted.de/*',
      '*://*.vinted.be/*',
      '*://*.vinted.nl/*',
      '*://*.vinted.pt/*',
      '*://*.vinted.net/*',
      '*://*.leboncoin.fr/*',
      '*://*.leboncoin.net/*',
      '*://img.leboncoin.fr/*',
    ],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
