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

		const element = await page.waitForSelector(
			'.wp-block-test-iframed-block'
		);
		const text = await element.evaluate( ( el ) => el.textContent );

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

		const iframeElement = await canvas().waitForSelector(
			'.wp-block-test-iframed-block'
		);
		const iframedText = await iframeElement.evaluate(
			( el ) => el.textContent
		);

		// Expect the script to load in the iframe, which replaces the block
		// text.
		expect( iframedText ).toBe( 'Iframed Block (set with jQuery)' );
	} );
} );
