/**
 * External dependencies
 */
import type { Browser, Page, BrowserContext } from '@playwright/test';

/**
 * Internal dependencies
 */
import { getPageError } from './get-page-error';
import { isCurrentURL } from './is-current-url';
import { visitAdminPage } from './visit-admin-page';
import { clickBlockToolbarButton } from './click-block-toolbar-button';
import { clickBlockAppender } from './click-block-appender';
import { createNewPost } from './create-new-post';
import { getCurrentUser } from './get-current-user';
import { loginUser } from './login-user';
import { showBlockToolbar } from './show-block-toolbar';
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';

class PageUtils {
	browser: Browser;
	page: Page;
	context: BrowserContext;

	constructor( page: Page ) {
		this.page = page;
		this.context = page.context();
		this.browser = this.context.browser()!;
	}

	getPageError = getPageError;
	isCurrentURL = isCurrentURL;
	visitAdminPage = visitAdminPage;
	clickBlockAppender = clickBlockAppender;
	clickBlockToolbarButton = clickBlockToolbarButton;
	createNewPost = createNewPost;
	getCurrentUser = getCurrentUser;
	loginUser = loginUser;
	showBlockToolbar = showBlockToolbar;
	switchUserToAdmin = switchUserToAdmin;
	switchUserToTest = switchUserToTest;
}

export { PageUtils };
