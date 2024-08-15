/**
 * External dependencies
 */
import type { Browser, Page, BrowserContext } from '@playwright/test';

/**
 * Internal dependencies
 */
import { dragFiles } from './drag-files';
import { isCurrentURL } from './is-current-url';
import { setClipboardData, pressKeys } from './press-keys';
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
	/** @borrows pressKeys as this.pressKeys */
	pressKeys: typeof pressKeys = pressKeys.bind( this );
	/** @borrows setBrowserViewport as this.setBrowserViewport */
	setBrowserViewport: typeof setBrowserViewport =
		setBrowserViewport.bind( this );
	/** @borrows setClipboardData as this.setClipboardData */
	setClipboardData: typeof setClipboardData = setClipboardData.bind( this );
}

export { PageUtils };
