/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe.only( 'Home page', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentythree' );
	} );

	test.beforeEach( async ( { page } ) => {
		await page.goto( '/' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'whole page', async ( { page } ) => {
		await expect( page ).toHaveScreenshot( { fullPage: true } );
	} );

	test( 'header', async ( { page } ) => {
		await expect( page.getByRole( 'banner' ) ).toHaveScreenshot();
	} );

	test( 'main', async ( { page } ) => {
		await expect( page.getByRole( 'main' ) ).toHaveScreenshot();
	} );

	test( 'footer', async ( { page } ) => {
		await expect( page.getByRole( 'contentinfo' ) ).toHaveScreenshot();
	} );

	test( 'logged out', async ( { browser } ) => {
		const incognitoContext = await browser.newContext( {
			storageState: undefined,
		} );
		const incognitoPage = await incognitoContext.newPage();
		await incognitoPage.goto( '/' );

		await expect
			.soft( incognitoPage )
			.toHaveScreenshot( { fullPage: true } );

		await incognitoContext.close();
	} );
} );
