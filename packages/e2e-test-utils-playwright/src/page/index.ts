/**
 * External dependencies
 */
import type { Browser, Page, BrowserContext } from '@playwright/test';

/**
 * Internal dependencies
 */
import { createNewPost } from './create-new-post';
import { getPageError } from './get-page-error';
import { insertBlock } from './insert-block';
import { isCurrentURL } from './is-current-url';
import {
	setClipboardData,
	pressKeyWithModifier,
} from './press-key-with-modifier';
import { showBlockToolbar } from './show-block-toolbar';
import { visitAdminPage } from './visit-admin-page';
import { focusSelectedBlock } from './inserter/focus-selected-block';
import { insertBlock } from './inserter/insert-block';
import { isGlobalInserterOpen } from './inserter/is-global-inserter-open';
import { openGlobalBlockInserter } from './inserter/open-global-block-inserter';
import { searchForBlock } from './inserter/search-for-block';
import { toggleGlobalBlockInserter } from './inserter/toggle-global-block-inserter';
import { waitForInserterCloseAndContentFocus } from './inserter/wait-for-inserter-close-and-focus-content';
import { canvas } from './canva';
import { clickBlockToolbarButton } from './click-block-toolbar-button';
import { showBlockToolbar } from '../show-block-toolbar';
import { getEditedPostContent } from './get-edited-post-content';
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

	createNewPost = createNewPost;
	getPageError = getPageError;
	insertBlock = insertBlock;
	isCurrentURL = isCurrentURL;
	pressKeyWithModifier = pressKeyWithModifier;
	setClipboardData = setClipboardData;
	showBlockToolbar = showBlockToolbar;
	visitAdminPage = visitAdminPage;
	focusSelectedBlock = focusSelectedBlock;
	insertBlock = insertBlock;
	isGlobalInserterOpen = isGlobalInserterOpen;
	openGlobalBlockInserter = openGlobalBlockInserter;
	searchForBlock = searchForBlock;
	toggleGlobalBlockInserter = toggleGlobalBlockInserter;
	waitForInserterCloseAndContentFocus = waitForInserterCloseAndContentFocus;
	canvas = canvas;
	clickBlockToolbarButton = clickBlockToolbarButton;
	showBlockToolbar = showBlockToolbar;
	getEditedPostContent = getEditedPostContent;
	wpDataSelect = wpDataSelect;
}

export { PageUtils };
