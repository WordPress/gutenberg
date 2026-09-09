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

		// `inert=''` attribute specified as string is rendered as `true` by a patched React 19 runtime.
		const inertString = block.locator(
			'.react-18-compat-block__inert-string'
		);
		await expect( inertString ).toHaveAttribute( 'inert' );

		// `inert=true` attribute specified as boolean is rendered as `true`.
		const inertBoolean = block.locator(
			'.react-18-compat-block__inert-boolean'
		);
		await expect( inertBoolean ).toHaveAttribute( 'inert' );
	} );
} );

test.describe( 'React 18 compatibility block (React 18 runtime)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
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
	} );

	test( 'renders a React 19 boolean inert attribute with React 18 runtime', async ( {
		editor,
	} ) => {
		await editor.insertBlock( { name: 'test/react-18-compat-block' } );

		const block = editor.canvas.locator(
			'role=document[name="Block: React 18 Compat Block"i]'
		);
		await expect( block ).toBeVisible();

		const inertBoolean = block.locator(
			'.react-18-compat-block__inert-boolean'
		);

		// This result is bad and should be fixed. The `inert=true` boolean
		// attribute should be rendered as `true`, but only the React 19 runtime
		// will do it (see the v19 test above). The React 18 runtime will ignore it.
		await expect( inertBoolean ).not.toHaveAttribute( 'inert' );
	} );
} );
