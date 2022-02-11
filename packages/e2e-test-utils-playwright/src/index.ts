/**
 * External dependencies
 */
import type { Browser, Page, BrowserContext } from '@playwright/test';

/**
 * Internal dependencies
 */
import { activatePlugin } from './activate-plugin';
import { activateTheme } from './activate-theme';
import { deleteAllBlocks } from './blocks';
import { clickBlockToolbarButton } from './click-block-toolbar-button';
import { createNewPost } from './create-new-post';
import { createURL } from './create-url';
import { deactivatePlugin } from './deactivate-plugin';
import { getCurrentUser } from './get-current-user';
import { getPageError } from './get-page-error';
import { isCurrentURL } from './is-current-url';
import { loginUser } from './login-user';
import { deleteAllPosts } from './posts';
import {
	rest as __experimentalRest,
	batch as __experimentalBatch,
} from './rest-api';
import { showBlockToolbar } from './show-block-toolbar';
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { visitAdminPage } from './visit-admin-page';
import { deleteAllWidgets } from './widgets';

class TestUtils {
	browser: Browser;
	page: Page;
	context: BrowserContext;

	constructor( page: Page ) {
		this.page = page;
		this.context = page.context();
		this.browser = this.context.browser()!;
	}

	activatePlugin = activatePlugin;
	activateTheme = activateTheme;
	clickBlockToolbarButton = clickBlockToolbarButton;
	createNewPost = createNewPost;
	createURL = createURL;
	deactivatePlugin = deactivatePlugin;
	deleteAllBlocks = deleteAllBlocks;
	deleteAllPosts = deleteAllPosts;
	getCurrentUser = getCurrentUser;
	getPageError = getPageError;
	isCurrentURL = isCurrentURL;
	loginUser = loginUser;
	showBlockToolbar = showBlockToolbar;
	switchUserToAdmin = switchUserToAdmin;
	switchUserToTest = switchUserToTest;
	visitAdminPage = visitAdminPage;
	deleteAllWidgets = deleteAllWidgets;
	__experimentalRest = __experimentalRest;
	__experimentalBatch = __experimentalBatch;
}

export { TestUtils };
