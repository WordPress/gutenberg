/**
 * External dependencies
 */
import type { Browser, Page, BrowserContext } from '@playwright/test';

/**
 * Internal dependencies
 */
import { createNewPost } from './create-new-post';
import { getPageError } from './get-page-error';
import { isCurrentURL } from './is-current-url';
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

	createNewPost = createNewPost;
	getPageError = getPageError;
	isCurrentURL = isCurrentURL;
	visitAdminPage = visitAdminPage;
}

export { PageUtils };
