import type { Browser, Page, BrowserContext } from '@playwright/test';
import { createNewPost } from './create-new-post';
import { getPageError } from './get-page-error';
import { visitAdminPage } from './visit-admin-page';
import { editPost } from './edit-post';
import { visitSiteEditor } from './visit-site-editor';
import { waitForSiteEditor } from './wait-for-site-editor';
import type { PageUtils } from '../page-utils';
import type { Editor } from '../editor';
import { WP_BASE_URL } from '../config';

type AdminConstructorProps = {
	page: Page;
	pageUtils: PageUtils;
	editor: Editor;
	baseURL?: string;
};

export class Admin {
	page: Page;
	context: BrowserContext;
	browser: Browser;
	pageUtils: PageUtils;
	editor: Editor;
	baseURL: string;

	constructor( {
		page,
		pageUtils,
		editor,
		baseURL = WP_BASE_URL,
	}: AdminConstructorProps ) {
		this.page = page;
		this.context = page.context();
		this.browser = this.context.browser()!;
		this.pageUtils = pageUtils;
		this.editor = editor;
		this.baseURL = baseURL;
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
	/** @borrows waitForSiteEditor as this.waitForSiteEditor */
	waitForSiteEditor: typeof waitForSiteEditor =
		waitForSiteEditor.bind( this );
}
