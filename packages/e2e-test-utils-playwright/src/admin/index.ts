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
import { visitSiteEditor } from './visit-site-editor';
import type { PageUtils } from '../page-utils';

type AdminConstructorProps = {
	page: Page;
	pageUtils: PageUtils;
};

export class Admin {
	browser: Browser;
	page: Page;
	pageUtils: PageUtils;
	context: BrowserContext;

	constructor( { page, pageUtils }: AdminConstructorProps ) {
		this.page = page;
		this.context = page.context();
		this.browser = this.context.browser()!;
		this.pageUtils = pageUtils;
	}

	/** @borrows createNewPost as this.createNewPost */
	createNewPost: typeof createNewPost = createNewPost.bind( this );
	/** @borrows getPageError as this.getPageError */
	getPageError: typeof getPageError = getPageError.bind( this );
	/** @borrows visitAdminPage as this.visitAdminPage */
	visitAdminPage: typeof visitAdminPage = visitAdminPage.bind( this );
	/** @borrows visitSiteEditor as this.visitSiteEditor */
	visitSiteEditor: typeof visitSiteEditor = visitSiteEditor.bind( this );
}
