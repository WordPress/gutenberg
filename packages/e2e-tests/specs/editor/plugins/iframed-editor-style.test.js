/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	insertBlock,
	openDocumentSettingsSidebar,
	clickButton,
	canvas,
} from '@wordpress/e2e-test-utils';

async function getComputedStyle( context ) {
	return await context.evaluate( () => {
		const container = document.querySelector( '.wp-block-paragraph' );
		return window.getComputedStyle( container )[ 'border-width' ];
	} );
}

describe( 'iframed editor styles', () => {
	beforeEach( async () => {
		await activatePlugin( 'gutenberg-test-iframed-editor-style' );
		await createNewPost( { postType: 'page' } );
	} );

	afterEach( async () => {
		await deactivatePlugin( 'gutenberg-test-iframed-editor-style' );
	} );

	it( 'should load editor styles through the block editor settings', async () => {
		await insertBlock( 'Paragraph' );

		expect( await getComputedStyle( page ) ).toBe( '1px' );

		await openDocumentSettingsSidebar();
		await clickButton( 'Page' );
		await clickButton( 'Template' );
		await clickButton( 'New' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'Iframed Test' );
		await clickButton( 'Create' );
		await page.waitForSelector( 'iframe[name="editor-canvas"]' );
		await canvas().waitForSelector( '.wp-block-paragraph' );

		expect( await getComputedStyle( canvas() ) ).toBe( '1px' );
	} );
} );
