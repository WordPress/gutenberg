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
import { publishPost } from './publish-post';
import { selectBlocks } from './select-blocks';
import { showBlockToolbar } from './show-block-toolbar';
import { saveSiteEditorEntities } from './site-editor';
import { transformBlockTo } from './transform-block-to';

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
	clickBlockOptionsMenuItem = clickBlockOptionsMenuItem.bind( this );
	clickBlockToolbarButton = clickBlockToolbarButton.bind( this );
	getEditedPostContent = getEditedPostContent.bind( this );
	insertBlock = insertBlock.bind( this );
	openDocumentSettingsSidebar = openDocumentSettingsSidebar.bind( this );
	openPreviewPage = openPreviewPage.bind( this );
	publishPost = publishPost.bind( this );
	saveSiteEditorEntities = saveSiteEditorEntities.bind( this );
	selectBlocks = selectBlocks.bind( this );
	showBlockToolbar = showBlockToolbar.bind( this );
	transformBlockTo = transformBlockTo.bind( this );
}
