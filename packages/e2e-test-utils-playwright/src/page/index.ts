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
import { isCurrentURL } from './is-current-url';
import { loginUser } from './login-user';
import { showBlockToolbar } from './show-block-toolbar';
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { toggleMoreMenu } from './toggle-more-menu';
import { visitAdminPage } from './visit-admin-page';
import { wpDataSelect } from './wp-data-select';
import { focusSelectedBlock } from './inserter/focus-selected-block';
import { insertBlock } from './inserter/insert-block';
import { isGlobalInserterOpen } from './inserter/is-global-inserter-open';
import { openGlobalBlockInserter } from './inserter/open-global-block-inserter';
import { searchForBlock } from './inserter/search-term';
import { toggleGlobalBlockInserter } from './inserter/toggle-global-block-inserter';
import { waitForInserterCloseAndContentFocus } from './inserter/wait-for-inserter-close-and-content-focus';
import { getEditedPostContent } from './get-edited-post-content';

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
	getCurrentUser = getCurrentUser;
	getPageError = getPageError;
	isCurrentURL = isCurrentURL;
	loginUser = loginUser;
	showBlockToolbar = showBlockToolbar;
	switchUserToAdmin = switchUserToAdmin;
	switchUserToTest = switchUserToTest;
	toggleMoreMenu = toggleMoreMenu;
	visitAdminPage = visitAdminPage;
	wpDataSelect = wpDataSelect;
	focusSelectedBlock = focusSelectedBlock;
	insertBlock = insertBlock;
	isGlobalInserterOpen = isGlobalInserterOpen;
	openGlobalBlockInserter = openGlobalBlockInserter;
	searchForBlock = searchForBlock;
	toggleGlobalBlockInserter = toggleGlobalBlockInserter;
	waitForInserterCloseAndContentFocus = waitForInserterCloseAndContentFocus;
	getEditedPostContent = getEditedPostContent;
}

export { PageUtils };
