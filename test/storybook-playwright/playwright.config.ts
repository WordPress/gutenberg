/**
 * External dependencies
 */
import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	outputDir: 'test-results/output',
	reporter: [
		[ 'html', { open: 'on-failure', outputFolder: 'test-results/report' } ],
	],
	fullyParallel: true,
};

export default config;
