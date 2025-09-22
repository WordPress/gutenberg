/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const ENDPOINT = [
	'/wp/v2/block-renderer',
	`rest_route=${ encodeURIComponent( '/wp/v2/block-renderer' ) }`,
];

function defer() {
	let resolve;
	const deferred = new Promise( ( res ) => {
		resolve = res;
	} );
	deferred.resolve = resolve;
	return deferred;
}

test.describe( 'Server-side rendered block', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-server-side-rendered-block'
		);
	} );
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'test/server-side-rendered-block' } );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-server-side-rendered-block'
		);
	} );

	test( 'displays updated content after changing the block attributes', async ( {
		editor,
		page,
	} ) => {
		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Test Server-Side Render',
		} );

		await page.getByRole( 'spinbutton', { name: 'Count' } ).fill( '1' );
		await expect( block ).toHaveText( 'Coffee count: 1' );
	} );

	test( 'displays an error message when the server-side render request fails', async ( {
		editor,
		context,
		page,
	} ) => {
		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Test Server-Side Render',
		} );

		await expect( block ).toHaveText( 'Coffee count: 0' );

		await context.setOffline( true );
		await page.getByRole( 'spinbutton', { name: 'Count' } ).fill( '5' );

		await expect( block ).toContainText( 'Error loading block' );
	} );

	test( 'displays a special placeholder when the request returns an empty successful response', async ( {
		editor,
		page,
	} ) => {
		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Test Server-Side Render',
		} );

		await expect( block ).toHaveText( 'Coffee count: 0' );

		// Input more than maximum value to trigger empty response.
		await page.getByRole( 'spinbutton', { name: 'Count' } ).fill( '20' );
		await expect( block ).toHaveText( 'Block rendered as empty.' );
	} );

	test( 'displays previous content followed by a loading spinner after a slight delay', async ( {
		editor,
		page,
	} ) => {
		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Test Server-Side Render',
		} );
		const deferred = defer();

		await expect( block ).toHaveText( 'Coffee count: 0' );
		await page.route(
			( url ) => ENDPOINT.some( ( u ) => url.href.includes( u ) ),
			async ( route ) => {
				await deferred;
				await route.continue();
			}
		);

		await page.getByRole( 'spinbutton', { name: 'Count' } ).fill( '3' );

		await expect( block.locator( '.components-spinner' ) ).toBeVisible();
		await expect( block ).toHaveText( 'Coffee count: 0' );
		await deferred.resolve();
		await expect( block ).toHaveText( 'Coffee count: 3' );
	} );
} );
