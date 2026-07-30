/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Workflow palette', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-workflow-palette',
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'fetches abilities only when the palette is opened', async ( {
		page,
		admin,
	} ) => {
		const abilityRequests = [];
		page.on( 'request', ( request ) => {
			const url = new URL( request.url() );
			const restRoute =
				url.searchParams.get( 'rest_route' ) ??
				url.pathname.replace( /^\/wp-json/, '' );
			if ( restRoute.startsWith( '/wp-abilities/v1/' ) ) {
				abilityRequests.push( restRoute );
			}
		} );

		await admin.visitAdminPage( 'index.php' );

		// Lazy init: nothing should have been fetched at admin load.
		expect( abilityRequests ).toEqual( [] );

		// Open the palette via its keyboard shortcut.
		await page.keyboard.press( 'ControlOrMeta+j' );

		const palette = page.getByRole( 'dialog', {
			name: 'Workflow palette',
		} );
		await expect( palette ).toBeVisible();

		// Opening the palette triggers the lazy fetch.
		await expect
			.poll( () => abilityRequests.sort() )
			.toEqual( [
				expect.stringMatching( /^\/wp-abilities\/v1\/abilities/ ),
				expect.stringMatching( /^\/wp-abilities\/v1\/categories/ ),
			] );

		// Once the fetch resolves, abilities should populate the palette.
		await expect(
			palette.getByRole( 'option', { name: 'Get Site Information' } )
		).toBeVisible();

		// Close the palette.
		await page.keyboard.press( 'Escape' );
		await expect( palette ).toBeHidden();

		// Reopening does not refetch.
		const requestCountAfterFirstOpen = abilityRequests.length;
		await page.keyboard.press( 'ControlOrMeta+j' );
		await expect( palette ).toBeVisible();
		expect( abilityRequests.length ).toBe( requestCountAfterFirstOpen );
	} );
} );
