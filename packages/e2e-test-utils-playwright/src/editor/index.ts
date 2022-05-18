/**
 * External dependencies
 */
import type { Browser, Page, BrowserContext, Frame } from '@playwright/test';

/**
 * Internal dependencies
 */
import { clickBlockOptionsMenuItem } from './click-block-options-menu-item';
import { clickBlockToolbarButton } from './click-block-toolbar-button';
import { getEditedPostContent } from './get-edited-post-content';
import { insertBlock } from './insert-block';
import { openDocumentSettingsSidebar } from './open-document-settings-sidebar';
import { openPreviewPage } from './preview';
import { selectBlockByClientId } from './select-block-by-client-id';
import { showBlockToolbar } from './show-block-toolbar';
import { saveSiteEditorEntities } from './site-editor';

type EditorConstructorProps = {
	page: Page;
	hasIframe?: boolean;
};

export class Editor {
	browser: Browser;
	page: Page;
	context: BrowserContext;
	#hasIframe: boolean;

	constructor( { page, hasIframe = false }: EditorConstructorProps ) {
		this.page = page;
		this.context = page.context();
		this.browser = this.context.browser()!;
		this.#hasIframe = hasIframe;
	}

	get canvas(): Frame | Page {
		let frame;

		if ( this.#hasIframe ) {
			frame = this.page.frame( 'editor-canvas' );
		} else {
			frame = this.page;
		}

		if ( ! frame ) {
			throw new Error(
				'EditorUtils: unable to find editor canvas iframe or page'
			);
		}

		return frame;
	}

	clickBlockOptionsMenuItem = clickBlockOptionsMenuItem;
	clickBlockToolbarButton = clickBlockToolbarButton;
	getEditedPostContent = getEditedPostContent;
	insertBlock = insertBlock;
	openDocumentSettingsSidebar = openDocumentSettingsSidebar;
	openPreviewPage = openPreviewPage;
	saveSiteEditorEntities = saveSiteEditorEntities;
	selectBlockByClientId = selectBlockByClientId;
	showBlockToolbar = showBlockToolbar;
}
