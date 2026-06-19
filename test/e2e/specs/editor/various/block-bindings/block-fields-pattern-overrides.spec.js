/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// The Block Fields panel resolves bound attribute values when rendering the
// inspector. A `core/pattern-overrides` binding used to crash it with
// "TypeError: Cannot read properties of null". These tests rely on the e2e
// fixtures failing any test that logs a console error.
// See https://github.com/WordPress/gutenberg/issues/79090.
test.describe( 'Block Fields with pattern overrides bindings', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-content-only-inspector-fields',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost( { title: 'Block Fields bindings' } );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'renders the panel for a `__default` binding without crashing', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Overridable paragraph',
				metadata: {
					name: 'Editable Paragraph',
					bindings: {
						__default: { source: 'core/pattern-overrides' },
					},
				},
			},
		} );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraph.click();
		await editor.openDocumentSettingsSidebar();

		// The canvas keeps rendering the block: no crash boundary fallback.
		await expect( paragraph ).toHaveText( 'Overridable paragraph' );
	} );

	test( 'renders the panel for an expanded binding without crashing', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Expanded binding paragraph',
				metadata: {
					name: 'Editable Paragraph',
					bindings: {
						content: { source: 'core/pattern-overrides' },
					},
				},
			},
		} );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraph.click();
		await editor.openDocumentSettingsSidebar();

		await expect( paragraph ).toHaveText( 'Expanded binding paragraph' );
	} );
} );
