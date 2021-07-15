/**
 * WordPress dependencies
 */
import { trashAllPosts, activateTheme } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { siteEditor } from '../../experimental-features';

describe( 'Site Editor Inserter', () => {
	beforeAll( async () => {
		await activateTheme( 'tt1-blocks' );
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
	} );
	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
	} );
	beforeEach( async () => {
		await siteEditor.visit();
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
