/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	canvas,
	activateTheme,
} from '@wordpress/e2e-test-utils';

async function getComputedStyle( context, selector, property ) {
	return await context.evaluate(
		( sel, prop ) =>
			window.getComputedStyle( document.querySelector( sel ) )[ prop ],
		selector,
		property
	);
}

describe( 'iframed inline styles', () => {
	beforeEach( async () => {
		// Activate the empty theme (block based theme), which is iframed.
		await activateTheme( 'emptytheme' );
		await activatePlugin( 'gutenberg-test-iframed-enqueue_block_assets' );
		await createNewPost();
	} );

	afterEach( async () => {
		await deactivatePlugin( 'gutenberg-test-iframed-enqueue_block_assets' );
		await activateTheme( 'twentytwentyone' );
	} );

	it( 'should load styles added through enqueue_block_assets', async () => {
		// Check stylesheet.
		expect(
			await getComputedStyle( canvas(), 'body', 'background-color' )
		).toBe( 'rgb(33, 117, 155)' );
		// Check inline style.
		expect( await getComputedStyle( canvas(), 'body', 'padding' ) ).toBe(
			'20px'
		);
	} );
} );
