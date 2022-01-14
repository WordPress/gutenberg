/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	insertBlock,
	getEditedPostContent,
	openDocumentSettingsSidebar,
	clickButton,
	canvas,
} from '@wordpress/e2e-test-utils';

async function getComputedStyle( context, property ) {
	await context.waitForSelector( '.wp-block-test-iframed-inline-styles' );
	return await context.evaluate( ( prop ) => {
		const container = document.querySelector(
			'.wp-block-test-iframed-inline-styles'
		);
		return window.getComputedStyle( container )[ prop ];
	}, property );
}

describe( 'iframed inline styles', () => {
	beforeEach( async () => {
		await activatePlugin( 'gutenberg-test-iframed-inline-styles' );
		await createNewPost( { postType: 'page' } );
	} );

	afterEach( async () => {
		await deactivatePlugin( 'gutenberg-test-iframed-inline-styles' );
	} );

	it.skip( 'should load inline styles in iframe', async () => {
		await insertBlock( 'Iframed Inline Styles' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
		expect( await getComputedStyle( page, 'padding' ) ).toBe( '20px' );
		expect( await getComputedStyle( page, 'border-width' ) ).toBe( '2px' );

		await openDocumentSettingsSidebar();
		await clickButton( 'Page' );
		await clickButton( 'Template' );
		await clickButton( 'New' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'Iframed Test' );
		await clickButton( 'Create' );
		await page.waitForSelector( 'iframe[name="editor-canvas"]' );

		// Inline styles of properly enqueued stylesheet should load.
		expect( await getComputedStyle( canvas(), 'padding' ) ).toBe( '20px' );

		// Inline styles of stylesheet loaded with the compatibility layer
		// should load.
		expect( await getComputedStyle( canvas(), 'border-width' ) ).toBe(
			'2px'
		);
	} );
} );
