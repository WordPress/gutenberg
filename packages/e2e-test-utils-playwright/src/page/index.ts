/**
 * External dependencies
 */
import type { Browser, Page, BrowserContext } from '@playwright/test';

/**
 * Internal dependencies
 */
import { canvas } from './canvas';
import { clickBlockToolbarButton } from './click-block-toolbar-button';
import { clickOnCloseModalButton } from './click-on-close-modal-button';
import { clickOnMoreMenuItem } from './click-on-more-menu-item';
import { createNewPost } from './create-new-post';
import { getCurrentUser } from './get-current-user';
import { getPageError } from './get-page-error';
import {
	focusSelectedBlock,
	insertBlock,
	isGlobalInserterOpen,
	openGlobalBlockInserter,
	toggleGlobalBlockInserter,
	searchForBlock,
	waitForInserterCloseAndContentFocus,
} from './inserter';
import { isCurrentURL } from './is-current-url';
import { loginUser } from './login-user';
import { showBlockToolbar } from './show-block-toolbar';
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { toggleMoreMenu } from './toggle-more-menu';
import { visitAdminPage } from './visit-admin-page';
import { wpDataSelect } from './wp-data-select';

class PageUtils {
	browser: Browser;
	page: Page;
	context: BrowserContext;

	constructor( page: Page ) {
		this.page = page;
		this.context = page.context();
		this.browser = this.context.browser()!;
	}

	canvas = canvas;
	clickBlockToolbarButton = clickBlockToolbarButton;
	clickOnCloseModalButton = clickOnCloseModalButton;
	clickOnMoreMenuItem = clickOnMoreMenuItem;
	createNewPost = createNewPost;
	focusSelectedBlock = focusSelectedBlock;
	getCurrentUser = getCurrentUser;
	getPageError = getPageError;
	insertBlock = insertBlock;
	isCurrentURL = isCurrentURL;
	isglobalInserterOpen = isGlobalInserterOpen;
	loginUser = loginUser;
	openGlobalBlockInserter = openGlobalBlockInserter;
	searchForBlock = searchForBlock;
	showBlockToolbar = showBlockToolbar;
	switchUserToAdmin = switchUserToAdmin;
	switchUserToTest = switchUserToTest;
	toggleGlobalBlockInserter = toggleGlobalBlockInserter;
	toggleMoreMenu = toggleMoreMenu;
	visitAdminPage = visitAdminPage;
	waitForInserterCloseAndContentFocus = waitForInserterCloseAndContentFocus;
	wpDataSelect = wpDataSelect;
}

export { PageUtils };
