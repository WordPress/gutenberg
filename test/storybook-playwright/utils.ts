/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

const STORYBOOK_PORT = '50241';

export const gotoStoryId = ( page: Page, storyId: string ) =>
	page.goto(
		`http://localhost:${ STORYBOOK_PORT }/iframe.html?id=${ storyId }`,
		{ waitUntil: 'load' }
	);
