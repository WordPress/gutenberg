/**
 * External dependencies
 */
import type {
	Browser,
	Page,
	BrowserContext,
	FrameLocator,
} from '@playwright/test';

/**
 * Internal dependencies
 */
import { clickBlockOptionsMenuItem } from './click-block-options-menu-item';
import { clickBlockToolbarButton } from './click-block-toolbar-button';
import { getBlocks } from './get-blocks';
import { getEditedPostContent } from './get-edited-post-content';
import { insertBlock } from './insert-block';
import { openDocumentSettingsSidebar } from './open-document-settings-sidebar';
import { openPreviewPage } from './preview';
import { publishPost } from './publish-post';
import { saveDraft } from './save-draft';
import { selectBlocks } from './select-blocks';
import { setContent } from './set-content';
import { setPreferences } from './set-preferences';
import { showBlockToolbar } from './show-block-toolbar';
import { saveSiteEditorEntities } from './site-editor';
import { setIsFixedToolbar } from './set-is-fixed-toolbar';
import { switchToLegacyCanvas } from './switch-to-legacy-canvas';
import { transformBlockTo } from './transform-block-to';
import { switchEditorTool } from './switch-editor-tool';

type EditorConstructorProps = {
	page: Page;
};

export class Editor {
	browser: Browser;
	page: Page;
	context: BrowserContext;

	constructor( { page }: EditorConstructorProps ) {
		this.page = page;
		this.context = page.context();
		this.browser = this.context.browser()!;
	}

	get canvas(): FrameLocator {
		return this.page.frameLocator( '[name="editor-canvas"]' );
	}

	/** @borrows clickBlockOptionsMenuItem as this.clickBlockOptionsMenuItem */
	clickBlockOptionsMenuItem: typeof clickBlockOptionsMenuItem =
		clickBlockOptionsMenuItem.bind( this );
	/** @borrows clickBlockToolbarButton as this.clickBlockToolbarButton */
	clickBlockToolbarButton: typeof clickBlockToolbarButton =
		clickBlockToolbarButton.bind( this );
	/** @borrows getBlocks as this.getBlocks */
	getBlocks: typeof getBlocks = getBlocks.bind( this );
	/** @borrows getEditedPostContent as this.getEditedPostContent */
	getEditedPostContent: typeof getEditedPostContent =
		getEditedPostContent.bind( this );
	/** @borrows insertBlock as this.insertBlock */
	insertBlock: typeof insertBlock = insertBlock.bind( this );
	/** @borrows openDocumentSettingsSidebar as this.openDocumentSettingsSidebar */
	openDocumentSettingsSidebar: typeof openDocumentSettingsSidebar =
		openDocumentSettingsSidebar.bind( this );
	/** @borrows openPreviewPage as this.openPreviewPage */
	openPreviewPage: typeof openPreviewPage = openPreviewPage.bind( this );
	/** @borrows publishPost as this.publishPost */
	publishPost: typeof publishPost = publishPost.bind( this );
	/** @borrows saveDraft as this.saveDraft */
	saveDraft: typeof saveDraft = saveDraft.bind( this );
	/** @borrows saveSiteEditorEntities as this.saveSiteEditorEntities */
	saveSiteEditorEntities: typeof saveSiteEditorEntities =
		saveSiteEditorEntities.bind( this );
	/** @borrows selectBlocks as this.selectBlocks */
	selectBlocks: typeof selectBlocks = selectBlocks.bind( this );
	/** @borrows setContent as this.setContent */
	setContent: typeof setContent = setContent.bind( this );
	/** @borrows setPreferences as this.setPreferences */
	setPreferences: typeof setPreferences = setPreferences.bind( this );
	/** @borrows showBlockToolbar as this.showBlockToolbar */
	showBlockToolbar: typeof showBlockToolbar = showBlockToolbar.bind( this );
	/** @borrows setIsFixedToolbar as this.setIsFixedToolbar */
	setIsFixedToolbar: typeof setIsFixedToolbar =
		setIsFixedToolbar.bind( this );
	/** @borrows switchEditorTool as this.switchEditorTool */
	switchEditorTool: typeof switchEditorTool = switchEditorTool.bind( this );
	/** @borrows switchToLegacyCanvas as this.switchToLegacyCanvas */
	switchToLegacyCanvas: typeof switchToLegacyCanvas =
		switchToLegacyCanvas.bind( this );
	/** @borrows transformBlockTo as this.transformBlockTo */
	transformBlockTo: typeof transformBlockTo = transformBlockTo.bind( this );
}
