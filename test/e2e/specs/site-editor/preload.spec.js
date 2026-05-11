/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Preload', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.resetPreferences();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Should make no requests before the iframe is loaded', async ( {
		page,
		admin,
	} ) => {
		const requests = [];

		function onRequest( request ) {
			if (
				request.resourceType() === 'document' &&
				request.url().startsWith( 'blob:' )
			) {
				// Stop recording when the iframe is initialized.
				page.off( 'request', onRequest );
			} else if ( request.resourceType() === 'fetch' ) {
				const urlObject = new URL( request.url() );
				const restRoute =
					urlObject.searchParams.get( 'rest_route' ) ??
					urlObject.pathname.replace( /^\/wp-json/, '' );
				requests.push( restRoute );
			}
		}

		page.on( 'request', onRequest );

		await admin.visitSiteEditor();

		// To do: these should all be removed or preloaded.
		expect( requests ).toEqual( [
			// Abilities system initialization.
			'/wp-abilities/v1/categories',
			'/wp-abilities/v1/abilities',
			// Seems to be coming from `enableComplementaryArea`.
			'/wp/v2/users/me',
			'/wp/v2/settings',
		] );
	} );
} );
