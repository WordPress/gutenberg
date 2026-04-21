/**
 * External dependencies
 */
import type { Browser, Page, BrowserContext } from '@playwright/test';

/**
 * Internal dependencies
 */
import { createNewPost } from './create-new-post';
import { getPageError } from './get-page-error';
import { visitAdminPage } from './visit-admin-page';
import { editPost } from './edit-post';
import { visitSiteEditor } from './visit-site-editor';
import type { PageUtils } from '../page-utils';
import type { Editor } from '../editor';

type AdminConstructorProps = {
	page: Page;
	pageUtils: PageUtils;
	editor: Editor;
};

export class Admin {
	page: Page;
	context: BrowserContext;
	browser: Browser;
	pageUtils: PageUtils;
	editor: Editor;

	constructor( { page, pageUtils, editor }: AdminConstructorProps ) {
		this.page = page;
		this.context = page.context();
		this.browser = this.context.browser()!;
		this.pageUtils = pageUtils;
		this.editor = editor;
	}

	/** @borrows createNewPost as this.createNewPost */
	createNewPost: typeof createNewPost = createNewPost.bind( this );
	/** @borrows editPost as this.editPost */
	editPost: typeof editPost = editPost.bind( this );
	/** @borrows getPageError as this.getPageError */
	getPageError: typeof getPageError = getPageError.bind( this );
	/** @borrows visitAdminPage as this.visitAdminPage */
	visitAdminPage: typeof visitAdminPage = visitAdminPage.bind( this );
	/** @borrows visitSiteEditor as this.visitSiteEditor */
	visitSiteEditor: typeof visitSiteEditor = visitSiteEditor.bind( this );
}
