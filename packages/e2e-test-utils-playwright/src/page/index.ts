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
import { openGlobalBlockInserter } from './inserter/open-global-block-inserter';
import { searchForBlock } from './inserter/search-for-block';
import { isGlobalInserterOpen } from './inserter/is-global-inserter-open';
import { toggleGlobalBlockInserter } from './inserter/toggle-global-block-inserter';
import { clickOnMoreMenuItem } from './click-on-more-menu-item';
import { toggleMoreMenu } from './toggle-more-menu';
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
	openGlobalBlockInserter = openGlobalBlockInserter;
	searchForBlock = searchForBlock;
	isGlobalInserterOpen = isGlobalInserterOpen;
	toggleGlobalBlockInserter = toggleGlobalBlockInserter;
	clickOnMoreMenuItem = clickOnMoreMenuItem;
	toggleMoreMenu = toggleMoreMenu;
}

export { PageUtils };
