/**
 * External dependencies
 */
import type { Browser, Page, BrowserContext } from '@playwright/test';

/**
 * Internal dependencies
 */
import { dragFiles } from './drag-files';
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

	dragFiles = dragFiles.bind( this );
	isCurrentURL = isCurrentURL.bind( this );
	pressKeyTimes = pressKeyTimes.bind( this );
	pressKeyWithModifier = pressKeyWithModifier.bind( this );
	setBrowserViewport = setBrowserViewport.bind( this );
	setClipboardData = setClipboardData.bind( this );
}

export { PageUtils };
