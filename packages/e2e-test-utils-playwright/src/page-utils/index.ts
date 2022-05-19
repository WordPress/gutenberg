/**
 * External dependencies
 */
import type { Browser, Page, BrowserContext } from '@playwright/test';

/**
 * Internal dependencies
 */
import { isCurrentURL } from './is-current-url';
import {
	setClipboardData,
	pressKeyWithModifier,
} from './press-key-with-modifier';
import { pressKeyTimes } from './press-key-times';
import { setBrowserViewport } from './set-browser-viewport';

type PageUtilConstructorParams = {
	page: Page;
};

class PageUtils {
	browser: Browser;
	page: Page;
	context: BrowserContext;

	constructor( { page }: PageUtilConstructorParams ) {
		this.page = page;
		this.context = page.context();
		this.browser = this.context.browser()!;
	}

	isCurrentURL = isCurrentURL;
	pressKeyTimes = pressKeyTimes;
	pressKeyWithModifier = pressKeyWithModifier;
	setBrowserViewport = setBrowserViewport;
	setClipboardData = setClipboardData;
}

export { PageUtils };
