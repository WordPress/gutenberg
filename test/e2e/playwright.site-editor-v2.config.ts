import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/*
 * Signals to `@wordpress/e2e-test-utils-playwright` (and to specs) that the
 * run targets the extensible site editor: `visitSiteEditor` navigates to
 * `admin.php?page=site-editor-v2` routes instead of `site-editor.php`, and
 * `setGutenbergExperiments` keeps the experiment enabled across resets.
 * `globalSetup` enables the experiment on the test site.
 */
process.env.GUTENBERG_E2E_SITE_EDITOR_V2 = '1';

const config = defineConfig( {
	...baseConfig,
	// Run the site editor suite against the extensible site editor. Tests for
	// features that intentionally have no v2 equivalent carry the
	// `@site-editor-v1-only` tag and are excluded here.
	testMatch: '**/specs/site-editor/**',
	globalSetup: fileURLToPath(
		new URL(
			'./config/global-setup-site-editor-v2.ts',
			'file:' + __filename
		).href
	),
	projects: [
		{
			name: 'chromium',
			use: { ...devices[ 'Desktop Chrome' ] },
			grepInvert: /-chromium|@site-editor-v1-only/,
		},
	],
} );

export default config;
