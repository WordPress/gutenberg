import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig( {
	plugins: [ react() ],
	test: {
		include: [ 'dom.fixture.jsx' ],
		environment: 'jsdom',
		globals: false,
		restoreMocks: true,
		setupFiles: [ './setup.mjs' ],
	},
} );
