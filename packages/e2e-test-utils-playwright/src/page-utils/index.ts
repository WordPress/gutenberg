/**
 * External dependencies
 */
import type {
	Browser,
	Page,
	BrowserContext,
	PlaywrightWorkerOptions,
} from '@playwright/test';

/**
 * Internal dependencies
 */
import { dragFiles } from './drag-files';
import { isCurrentURL } from './is-current-url';
import { setClipboardData, pressKeys } from './press-keys';
import { setBrowserViewport } from './set-browser-viewport';
import { emulateNetworkConditions } from './emulate-network-conditions';

type PageUtilConstructorParams = {
	page: Page;
	browserName: PlaywrightWorkerOptions[ 'browserName' ];
};

class PageUtils {
	browser: Browser;
	page: Page;
	context: BrowserContext;
	browserName: PlaywrightWorkerOptions[ 'browserName' ];

	constructor( { page, browserName }: PageUtilConstructorParams ) {
		this.page = page;
		this.context = page.context();
		this.browser = this.context.browser()!;
		this.browserName = browserName;
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
	/** @borrows emulateNetworkConditions as this.emulateNetworkConditions */
	emulateNetworkConditions: typeof emulateNetworkConditions =
		emulateNetworkConditions.bind( this );
}

export { PageUtils };
