/**
 * WordPress dependencies
 */
import {
	deleteAllTemplates,
	activateTheme,
	visitSiteEditor,
} from '@wordpress/e2e-test-utils';

describe( 'Site Editor Inserter', () => {
	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		await deleteAllTemplates( 'wp_template' );
		await deleteAllTemplates( 'wp_template_part' );
	} );
	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
	} );
	beforeEach( async () => {
		await visitSiteEditor();
	} );

	it( 'inserter toggle button should toggle global inserter', async () => {
		await page.click( '.edit-site-header-toolbar__inserter-toggle' );
		await page.waitForSelector( '.edit-site-editor__inserter-panel', {
			visible: true,
		} );
		await page.click( '.edit-site-header-toolbar__inserter-toggle' );
		await page.waitForSelector( '.edit-site-editor__inserter-panel', {
			hidden: true,
		} );
	} );
} );
