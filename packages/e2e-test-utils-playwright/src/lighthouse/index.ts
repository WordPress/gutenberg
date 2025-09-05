/**
 * External dependencies
 */
import type { Page } from '@playwright/test';
import * as lighthouse from 'lighthouse/core/index.cjs';

type LighthouseConstructorProps = {
	page: Page;
	port: number;
};

export class Lighthouse {
	page: Page;
	port: number;

	constructor( { page, port }: LighthouseConstructorProps ) {
		this.page = page;
		this.port = port;
	}

	/**
	 * Returns the Lighthouse report for the current URL.
	 *
	 * Runs several Lighthouse audits in a separate browser window and returns
	 * the summary.
	 */
	async getReport() {
		// From https://github.com/GoogleChrome/lighthouse/blob/36cac182a6c637b1671c57326d7c0241633d0076/core/config/default-config.js#L381-L446
		const audits = {
			'largest-contentful-paint': 'LCP',
			'total-blocking-time': 'TBT',
			interactive: 'TTI',
			'cumulative-layout-shift': 'CLS',
			'interaction-to-next-paint': 'INP',
		};

		const report = await lighthouse(
			this.page.url(),
			{ port: this.port },
			{
				extends: 'lighthouse:default',
				settings: {
					// "provided" means no throttling.
					// TODO: Make configurable.
					throttlingMethod: 'provided',
					// Default is "mobile".
					// See https://github.com/GoogleChrome/lighthouse/blob/main/docs/emulation.md
					// TODO: Make configurable.
					formFactor: 'desktop',
					screenEmulation: {
						disabled: true,
					},
					// Speeds up the report.
					disableFullPageScreenshot: true,
					// Only run certain audits to speed things up.
					onlyAudits: Object.keys( audits ),
				},
			}
		);

		const result: Record< string, number > = {};

		if ( ! report ) {
			return result;
		}

		const { lhr } = report;

		for ( const [ audit, acronym ] of Object.entries( audits ) ) {
			result[ acronym ] = lhr.audits[ audit ]?.numericValue || 0;
		}

		return result;
	}
}
