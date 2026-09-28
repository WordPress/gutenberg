const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Whether the run targets the extensible site editor (v2). Its pagination
// state lives in the route path carried by the `p` query param, under a
// different name than the classic editor's top-level `pageNumber`.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

function getPageNumber( url ) {
	const { searchParams } = new URL( url );
	if ( ! isSiteEditorV2 ) {
		return searchParams.get( 'pageNumber' );
	}
	const route = searchParams.get( 'p' ) ?? '';
	return new URLSearchParams( route.split( '?' )[ 1 ] ?? '' ).get( 'page' );
}

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

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor( { postType: 'page' } );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deleteAllPages();
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
		expect( getPageNumber( page.url() ) ).toBe( '2' );
		await page
			.getByRole( 'button', { name: 'Previous page', exact: true } )
			.click();
		expect( getPageNumber( page.url() ) ).toBe( '1' );
		await page
			.getByRole( 'button', { name: 'Next page', exact: true } )
			.click();
		expect( getPageNumber( page.url() ) ).toBe( '2' );
	} );
} );
