/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Preventing Pattern Recursion', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-protection-against-recursive-patterns'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-protection-against-recursive-patterns'
		);
	} );

	test( 'prevents infinite loops due to recursive patterns', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/pattern',
			attributes: { slug: 'evil/recursive' },
		} );
		const warning = editor.canvas.getByText(
			'Pattern "evil/recursive" cannot be rendered inside itself'
		);
		await expect( warning ).toBeVisible();
	} );
} );
