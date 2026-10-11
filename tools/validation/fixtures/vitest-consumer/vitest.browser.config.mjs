import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig( {
	plugins: [ react() ],
	test: {
		include: [ 'browser.fixture.jsx' ],
		globals: false,
		browser: {
			enabled: true,
			headless: true,
			provider: playwright(),
			instances: [ { browser: 'chromium' } ],
		},
	},
} );
