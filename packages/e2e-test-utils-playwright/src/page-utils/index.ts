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

	/** @borrows dragFiles as this.dragFiles */
	dragFiles: typeof dragFiles = dragFiles.bind( this );
	/** @borrows isCurrentURL as this.isCurrentURL */
	isCurrentURL: typeof isCurrentURL = isCurrentURL.bind( this );
	/** @borrows pressKeyTimes as this.pressKeyTimes */
	pressKeyTimes: typeof pressKeyTimes = pressKeyTimes.bind( this );
	/** @borrows pressKeyWithModifier as this.pressKeyWithModifier */
	pressKeyWithModifier: typeof pressKeyWithModifier =
		pressKeyWithModifier.bind( this );
	/** @borrows setBrowserViewport as this.setBrowserViewport */
	setBrowserViewport: typeof setBrowserViewport =
		setBrowserViewport.bind( this );
	/** @borrows setClipboardData as this.setClipboardData */
	setClipboardData: typeof setClipboardData = setClipboardData.bind( this );
}

export { PageUtils };
