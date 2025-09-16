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
				const url = request.url();
				const urlObject = new URL( url );
				const restRoute = urlObject.searchParams.get( 'rest_route' );
				if ( restRoute ) {
					urlObject.searchParams.delete( 'rest_route' );
					urlObject.searchParams.delete( '_locale' );
					requests.push( restRoute + urlObject.search );
				} else {
					requests.push( url );
				}
			}
		}

		page.on( 'request', onRequest );

		await admin.visitSiteEditor();

		// To do: these should all be removed or preloaded.
		expect( requests ).toEqual( [
			// I'm not quite sure why this is needed, because it is preloaded.
			// It might be that there's a request that invalides the resolver
			// and then triggers a new request.
			'/wp/v2/templates/lookup?slug=front-page',
			// Seems to be coming from `enableComplementaryArea`.
			'/wp/v2/users/me',
			'/wp/v2/wp_template',
			// This is the auto-draft template.
			expect.stringMatching( /\/wp\/v2\/wp_template\/\d+\?context=edit/ ),
			// There are two separate settings OPTIONS requests. We should fix
			// so the one for canUser and getEntityRecord are reused.
			'/wp/v2/settings',
		] );
	} );
} );
