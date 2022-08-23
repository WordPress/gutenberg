/**
 * WordPress dependencies
 */
import { activateTheme, visitSiteEditor } from '@wordpress/e2e-test-utils';

describe( 'Site editor iframe rendering mode', () => {
	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
	} );

	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
	} );

	it( 'Should render editor in standards mode.', async () => {
		await visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
		} );

		const compatMode = await page.evaluate(
			() =>
				document.querySelector( `iframe[name='editor-canvas']` )
					.contentDocument.compatMode
		);

		// CSS1Compat = expected standards mode.
		// BackCompat = quirks mode.
		expect( compatMode ).toBe( 'CSS1Compat' );
	} );
} );
