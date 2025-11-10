/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'DataViews Pagination', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		// Create 11 pages to force pagination when perPage is set to 10.
		await requestUtils.batchRest(
			Array( 11 )
				.fill()
				.map( ( _, i ) => ( {
					method: 'POST',
					path: '/wp/v2/pages',
					body: {
						title: `Test Page ${ i + 1 }`,
						status: 'publish',
					},
				} ) )
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deleteAllPages();
	} );

	test.beforeEach( async ( { admin, page } ) => {
		await admin.visitSiteEditor();
		await page.getByRole( 'button', { name: 'Pages' } ).click();
	} );

	test( 'navigates forward, backward, and forward again correctly', async ( {
		page,
	} ) => {
		// Open View options and set items per page to 10.
		await page.getByRole( 'button', { name: 'View options' } ).click();
		await page.getByRole( 'radio', { name: 10 } ).click();
		await page.keyboard.press( 'Escape' ); // Close the View options panel.

		await page
			.getByRole( 'button', { name: 'Next page', exact: true } )
			.click();
		expect( new URL( page.url() ).searchParams.get( 'pageNumber' ) ).toBe(
			'2'
		);
		await page
			.getByRole( 'button', { name: 'Previous page', exact: true } )
			.click();
		expect( new URL( page.url() ).searchParams.get( 'pageNumber' ) ).toBe(
			'1'
		);
		await page
			.getByRole( 'button', { name: 'Next page', exact: true } )
			.click();
		expect( new URL( page.url() ).searchParams.get( 'pageNumber' ) ).toBe(
			'2'
		);
	} );
} );
