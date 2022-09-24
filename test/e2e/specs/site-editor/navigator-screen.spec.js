/**
 * WordPress dependencies
 */

const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'NavigatorScreen', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'should not change focus when an input element is changed.', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
		} );

		await page.click( 'role=button[name="Styles"i]' );
		await page.click( 'role=button[name="Layout styles"i]' );

		expect(
			await page.$eval(
				'role=button[name="Navigate to the previous view"i]',
				( el ) => el === document.activeElement
			)
		).toBe( true );

		await page
			.locator( 'role=spinbutton[name="All sides padding"i]' )
			.fill( '1' );

		expect(
			await page.$eval(
				'role=button[name="Navigate to the previous view"i]',
				( el ) => el === document.activeElement
			)
		).not.toBe( true );

		expect(
			await page.$eval(
				'role=spinbutton[name="All sides padding"i]',
				( el ) => el === document.activeElement
			)
		).toBe( true );
	} );
} );
