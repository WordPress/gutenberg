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
					// With pretty permalinks, REST API calls use
					// the /wp-json/ prefix instead of ?rest_route=.
					const wpJsonPrefix = '/wp-json';
					const wpJsonIndex =
						urlObject.pathname.indexOf( wpJsonPrefix );
					if ( wpJsonIndex !== -1 ) {
						const route = urlObject.pathname.substring(
							wpJsonIndex + wpJsonPrefix.length
						);
						urlObject.searchParams.delete( '_locale' );
						requests.push( route + urlObject.search );
					} else {
						requests.push( url );
					}
				}
			}
		}

		page.on( 'request', onRequest );

		await admin.visitSiteEditor();

		// To do: these should all be removed or preloaded.
		expect( requests ).toEqual( [
			// Abilities system initialization.
			'/wp-abilities/v1/categories?per_page=100&context=edit',
			'/wp-abilities/v1/abilities?per_page=100&context=edit',
			// Seems to be coming from `enableComplementaryArea`.
			'/wp/v2/users/me',
			'/wp/v2/settings',
		] );
	} );
} );
