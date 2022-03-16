/**
 * External dependencies
 */
import type { Browser, Page, BrowserContext } from '@playwright/test';

/**
 * Internal dependencies
 */
import { clickBlockToolbarButton } from './click-block-toolbar-button';
import { createNewPost } from './create-new-post';
import { getCurrentUser } from './get-current-user';
import { getPageError } from './get-page-error';
import { isCurrentURL } from './is-current-url';
import { loginUser } from './login-user';
import { showBlockToolbar } from './show-block-toolbar';
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { visitAdminPage } from './visit-admin-page';
import { focusSelectedBlock } from './inserter/focus-selected-block';
import { insertBlock } from './inserter/insert-block';
import { isGlobalInserterOpen } from './inserter/is-global-inserter-open';
import { openGlobalBlockInserter } from './inserter/open-global-block-inserter';
import { searchForBlock } from './inserter/search-term';
import { toggleGlobalBlockInserter } from './inserter/toggle-golabl-block-inserter';
import { waitForInserterCloseAndContentFocus } from './inserter/wait-for-inserter-close-and-focus-content';
import { canvas } from './canvas';
import { clickOnCloseModalButton } from './click-on-close-modal-button';
import { clickOnMoreMenuItem } from './click-on-more-menu-item';
import { getEditedPostContent } from './get-edited-post-content';
import { wpDataSelect } from './wp-data-select';
import { toggleMoreMenu } from './toggle-more-menu';
import { saveDraft } from './save-draft';
import { openDocumentSettingsSidebar } from './open-document-settings-sidebar';
import { togglePreferencesOption } from './toggle-preferences-option';
import { getAllBlockInserterItemTitles } from './get-all-block-inserter-item-titles';
import { closeGlobalBlockInserter } from './inserter/close-global-block-interser';
import { openPublishPanel } from './open-publish-panel';
import { publishPost } from './publish-post';
import { findSidebarPanelWithTitle } from './find-sidebar-panel-with-title';
import { openSidebarPanelWithTitle } from './open-sidebar-panel-with-title';
import { clickBlockAppender } from './click-block-appender';
import { findSidebarPanelToggleButtonWithTitle } from './find-sidebar-panel-toggle-button-with-title';

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
	getCurrentUser = getCurrentUser;
	getPageError = getPageError;
	isCurrentURL = isCurrentURL;
	loginUser = loginUser;
	showBlockToolbar = showBlockToolbar;
	switchUserToAdmin = switchUserToAdmin;
	switchUserToTest = switchUserToTest;
	visitAdminPage = visitAdminPage;
	focusSelectedBlock = focusSelectedBlock;
	insertBlock = insertBlock;
	isGlobalInserterOpen = isGlobalInserterOpen;
	openGlobalBlockInserter = openGlobalBlockInserter;
	searchForBlock = searchForBlock;
	toggleGlobalBlockInserter = toggleGlobalBlockInserter;
	waitForInserterCloseAndContentFocus = waitForInserterCloseAndContentFocus;
	canvas = canvas;
	clickOnCloseModalButton = clickOnCloseModalButton;
	clickOnMoreMenuItem = clickOnMoreMenuItem;
	getEditedPostContent = getEditedPostContent;
	wpDataSelect = wpDataSelect;
	toggleMoreMenu = toggleMoreMenu;
	saveDraft = saveDraft;
	openDocumentSettingsSidebar = openDocumentSettingsSidebar;
	togglePreferencesOption = togglePreferencesOption;
	getAllBlockInserterItemTitles = getAllBlockInserterItemTitles;
	closeGlobalBlockInserter = closeGlobalBlockInserter;
	openPublishPanel = openPublishPanel;
	publishPost = publishPost;
	findSidebarPanelWithTitle = findSidebarPanelWithTitle;
	openSidebarPanelWithTitle = openSidebarPanelWithTitle;
	clickBlockAppender = clickBlockAppender;
	findSidebarPanelToggleButtonWithTitle = findSidebarPanelToggleButtonWithTitle;
}

export { PageUtils };
