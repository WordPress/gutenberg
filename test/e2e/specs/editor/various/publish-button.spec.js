/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

function defer() {
	let resolve;
	const deferred = new Promise( ( res ) => {
		resolve = res;
	} );
	deferred.resolve = resolve;
	return deferred;
}

test.describe( 'Post publish button', () => {
	test( 'should be disabled when post is not saveable', async ( {
		admin,
		page,
	} ) => {
		await admin.createNewPost();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Publish' } )
		).toBeDisabled();
	} );

	test( 'should be disabled when post is being saved', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.canvas
			.getByRole( 'textbox', {
				name: 'Add title',
			} )
			.fill( 'Test post' );

		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		await expect(
			topBar.getByRole( 'button', { name: 'Publish' } )
		).toBeEnabled();

		const deferred = defer();

		await page.route(
			( url ) =>
				url.href.includes(
					`rest_route=${ encodeURIComponent( '/wp/v2/posts/' ) }`
				),
			async ( route, request ) => {
				if ( request.method() === 'POST' ) {
					await deferred;
					await route.continue();
				} else {
					await route.continue();
				}
			}
		);

		await topBar.getByRole( 'button', { name: 'Save draft' } ).click();
		await expect(
			topBar.getByRole( 'button', { name: 'Publish' } )
		).toBeDisabled();
		deferred.resolve();
	} );

	test( 'should be disabled when metabox is being saved', async ( {
		admin,
		page,
		requestUtils,
		editor,
	} ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-plugin-meta-box' );
		await admin.createNewPost();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Test post' );

		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		await expect(
			topBar.getByRole( 'button', { name: 'Publish' } )
		).toBeEnabled();

		const deferred = defer();

		await page.route(
			( url ) => url.searchParams.has( 'meta-box-loader', 1 ),
			async ( route ) => {
				await deferred;
				await route.continue();
			}
		);

		await topBar.getByRole( 'button', { name: 'Save draft' } ).click();
		await expect(
			topBar.getByRole( 'button', { name: 'Publish' } )
		).toBeDisabled();
		deferred.resolve();

		await requestUtils.deactivatePlugin( 'gutenberg-test-plugin-meta-box' );
	} );
} );
