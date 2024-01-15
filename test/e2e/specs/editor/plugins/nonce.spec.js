/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Nonce', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'should refresh when expired', async ( {
		page,
		admin,
		requestUtils,
		editor,
	} ) => {
		await admin.createNewPost();
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toBeFocused();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'test' );

		/**
		 * Mock network and manually expire the API nonce until refreshed.
		 */
		{
			let refreshed = false;

			page.on( 'response', ( response ) => {
				if (
					response
						.url()
						.includes(
							'/wp-admin/admin-ajax.php?action=rest-nonce'
						) &&
					response.status() === 200
				) {
					refreshed = true;
				}
			} );

			await page.route(
				// Intercept every REST API endpoint.
				( url ) =>
					url.href.startsWith(
						requestUtils.storageState.rootURL.slice( 0, -1 )
					),
				async ( route ) => {
					if ( refreshed ) {
						await route.continue();
					} else {
						await route.fulfill( {
							status: 403,
							contentType: 'application/json; charset=UTF-8',
							body: JSON.stringify( {
								code: 'rest_cookie_invalid_nonce',
								data: { status: 403 },
								message: 'Cookie check failed',
							} ),
						} );
					}
				}
			);
		}

		const saveDraftResponses = [];
		page.on( 'response', ( response ) => {
			const request = response.request();
			if (
				request.method() === 'POST' &&
				request.postDataJSON()?.status === 'draft'
			) {
				saveDraftResponses.push( response.status() );
			}
		} );

		// Saving draft should still succeed after retrying.
		await editor.saveDraft();

		// We expect a 403 status only once.
		expect( saveDraftResponses ).toEqual( [ 403, 200 ] );
	} );
} );
