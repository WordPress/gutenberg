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

describe( 'changing image size', () => {
	beforeEach( async () => {
		await activatePlugin( 'gutenberg-test-iframed-block' );
		await createNewPost( { postType: 'page' } );
	} );

	afterEach( async () => {
		await deactivatePlugin( 'gutenberg-test-iframed-block' );
	} );

	it( 'should load script and dependencies in iframe', async () => {
		await insertBlock( 'Iframed Block' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.waitForSelector( '.wp-block-test-iframed-block' );
		const text = await page.evaluate( () => {
			return document.querySelector( '.wp-block-test-iframed-block' )
				.innerText;
		} );

		expect( text ).toBe( 'Iframed Block (set with jQuery)' );

		await openDocumentSettingsSidebar();
		await clickButton( 'Page' );
		await clickButton( 'Template' );
		await clickButton( 'New' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'Iframed Test' );
		await clickButton( 'Create' );
		await page.waitForSelector( 'iframe[name="editor-canvas"]' );

		const iframedText = await canvas().evaluate( () => {
			return document.querySelector( '.wp-block-test-iframed-block' )
				.innerText;
		} );

		// Expect the script to load in the iframe, which replaces the block
		// text.
		expect( iframedText ).toBe( 'Iframed Block (set with jQuery)' );
	} );
} );
