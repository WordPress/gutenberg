/**
 * External dependencies
 */
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	outputDir: 'test-results/output',
	reporter: [
		[ 'html', { open: 'on-failure', outputFolder: 'test-results/report' } ],
	],
};

export default config;
