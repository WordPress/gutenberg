/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function getComputedStyle( context, property ) {
	await context.waitForSelector( '.wp-block-test-iframed-inline-styles' );
	return await context.evaluate( ( prop ) => {
		const container = document.querySelector(
			'.wp-block-test-iframed-inline-styles'
		);
		return window.getComputedStyle( container )[ prop ];
	}, property );
}

test.describe( 'iframed inline styles', () => {
	test.beforeEach( async ( { admin, requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-iframed-inline-styles'
		);
		await admin.createNewPost( { postType: 'page' } );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-iframed-inline-styles'
		);
	} );

	// Skip flaky test. See https://github.com/WordPress/gutenberg/issues/35172
	test( 'should load inline styles in iframe', async ( { page, editor } ) => {
		await editor.insertBlock( { name: 'test/iframed-inline-styles' } );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
		expect( await getComputedStyle( page, 'padding' ) ).toBe( '20px' );
		expect( await getComputedStyle( page, 'border-width' ) ).toBe( '2px' );

		await page.click( 'role=button[name=/Page/i] >> nth=0' );
		await page.click( 'role=button[name="Template"i]' );
		await page.click( 'role=button[name="New"i]' );
		await page.fill( 'role=textbox[name="NAME"i]', 'Iframed Test' );
		await page.click( 'role=button[name="Create"i]' );

		// Inline styles of properly enqueued stylesheet should load.
		expect(
			await getComputedStyle(
				page.frames().find( ( f ) => f.name() === 'editor-canvas' ) ||
					page,
				'padding'
			)
		).toBe( '20px' );

		// Inline styles of stylesheet loaded with the compatibility layer
		// should load.
		expect(
			await getComputedStyle(
				page.frames().find( ( f ) => f.name() === 'editor-canvas' ) ||
					page,
				'border-width'
			)
		).toBe( '2px' );
	} );
} );
