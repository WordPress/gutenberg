/**
 * External dependencies
 */
import type { Browser, Page, BrowserContext } from '@playwright/test';

/**
 * Internal dependencies
 */
import { clickBlockToolbarButton } from './click-block-toolbar-button';
import { createNewPost } from './create-new-post';
import { getEditedPostContent } from './get-edited-post-content';
import { getPageError } from './get-page-error';
import { insertBlock } from './insert-block';
import { isCurrentURL } from './is-current-url';
import {
	setClipboardData,
	pressKeyWithModifier,
} from './press-key-with-modifier';
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
	createNewPost = createNewPost;
	getEditedPostContent = getEditedPostContent;
	getPageError = getPageError;
	insertBlock = insertBlock;
	isCurrentURL = isCurrentURL;
	pressKeyWithModifier = pressKeyWithModifier;
	setClipboardData = setClipboardData;
	showBlockToolbar = showBlockToolbar;
	visitAdminPage = visitAdminPage;
}

export { PageUtils };
