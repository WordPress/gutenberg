/**
 * External dependencies
 */
import type { Browser, Page, BrowserContext } from '@playwright/test';

/**
 * Internal dependencies
 */
import { clickBlockToolbarButton } from './click-block-toolbar-button';
import { getPageError } from './get-page-error';
import { isCurrentURL } from './is-current-url';
import { showBlockToolbar } from './show-block-toolbar';
import { visitAdminPage } from './visit-admin-page';

class PageUtils {
	browser: Browser;
	page: Page;
	context: BrowserContext;

	constructor( page: Page ) {
		this.page = page;
		this.context = page.context();
		this.browser = this.context.browser()!;
	}

	clickBlockToolbarButton = clickBlockToolbarButton;
	getPageError = getPageError;
	isCurrentURL = isCurrentURL;
	showBlockToolbar = showBlockToolbar;
	visitAdminPage = visitAdminPage;
}

export { PageUtils };
