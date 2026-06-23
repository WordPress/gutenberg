/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// This block deliberately exercises legacy React 18 patterns (a bundled React
// 18 development JSX runtime that produces `Symbol.for( 'react.element' )`
// elements, a function component relying on `defaultProps`, and the `inert`
// attribute) while the editor runs on the externalized React 19 runtime.
//
// It is expected to FAIL until the React 19 compatibility layer can render
// elements created by an older React runtime and restore `defaultProps`
// support for function components. The assertions below describe the desired
// end state and act as a checklist for that work.
test.describe( 'React 18 compatibility block (React 19 runtime)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [ 'gutenberg-react-19' ] );
		await requestUtils.activatePlugin(
			'gutenberg-test-react-18-compat-block'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-react-18-compat-block'
		);
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'renders legacy elements, defaultProps and inert under React 19', async ( {
		editor,
	} ) => {
		await editor.insertBlock( { name: 'test/react-18-compat-block' } );

		const block = editor.canvas.locator(
			'role=document[name="Block: React 18 Compat Block"i]'
		);

		// The block renders without tripping the block error boundary.
		await expect( block ).toBeVisible();

		// `defaultProps` is resolved for the function component rendered with
		// the externalized React runtime.
		await expect(
			block.locator( '.react-18-compat-block__greeting' )
		).toHaveText( 'Hello from defaultProps' );

		// The subtree built with the bundled React 18 runtime renders, keeping
		// the `inert` attribute on the important element.
		const inert = block.locator( '.react-18-compat-block__inert' );
		await expect( inert ).toHaveAttribute( 'inert', '' );
		await expect( inert ).toContainText(
			'This subtree is inert and built with the React 18 runtime.'
		);
	} );
} );
