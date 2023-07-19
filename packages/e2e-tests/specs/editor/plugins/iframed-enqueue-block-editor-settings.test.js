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

describe( 'iframed block editor settings styles', () => {
	beforeEach( async () => {
		// Activate the empty theme (block based theme), which is iframed.
		await activateTheme( 'emptytheme' );
		await activatePlugin(
			'gutenberg-test-iframed-enqueue-block-editor-settings'
		);
		await createNewPost();
	} );

	afterEach( async () => {
		await deactivatePlugin(
			'gutenberg-test-iframed-enqueue-block-editor-settings'
		);
		await activateTheme( 'twentytwentyone' );
	} );

	it( 'should load styles added through block editor settings', async () => {
		await page.waitForSelector( 'iframe[name="editor-canvas"]' );
		// Expect a red border (added in PHP).
		expect( await getComputedStyle( canvas(), 'p', 'border-color' ) ).toBe(
			'rgb(255, 0, 0)'
		);

		await page.evaluate( () => {
			const settings = window.wp.data
				.select( 'core/editor' )
				.getEditorSettings();
			wp.data.dispatch( 'core/editor' ).updateEditorSettings( {
				...settings,
				styles: [
					...settings.styles,
					{
						css: 'p { border-width: 2px; }',
					},
				],
			} );
		} );

		// Expect a 2px border (added in JS).
		expect( await getComputedStyle( canvas(), 'p', 'border-width' ) ).toBe(
			'2px'
		);
	} );
} );
