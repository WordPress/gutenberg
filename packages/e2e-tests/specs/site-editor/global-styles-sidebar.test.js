/**
 * WordPress dependencies
 */
import {
	deleteAllTemplates,
	activateTheme,
	visitSiteEditor,
	toggleGlobalStyles,
	openGlobalStylesPanel,
} from '@wordpress/e2e-test-utils';

describe( 'Global styles sidebar', () => {
	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		await Promise.all( [
			deleteAllTemplates( 'wp_template' ),
			deleteAllTemplates( 'wp_template_part' ),
		] );
	} );
	afterAll( async () => {
		await Promise.all( [
			deleteAllTemplates( 'wp_template' ),
			deleteAllTemplates( 'wp_template_part' ),
		] );
		await activateTheme( 'twentytwentyone' );
	} );
	beforeEach( async () => {
		await visitSiteEditor();
	} );
	describe( 'blocks list', () => {
		it( 'should filter results properly', async () => {
			await toggleGlobalStyles();
			await openGlobalStylesPanel( 'Blocks' );
			await page.focus( '.edit-site-block-types-search input' );
			await page.keyboard.type( 'heading' );
			const results = await page.$$(
				'.edit-site-block-types-item-list div[role="listitem"]'
			);
			expect( results.length ).toEqual( 1 );
		} );
	} );
} );
