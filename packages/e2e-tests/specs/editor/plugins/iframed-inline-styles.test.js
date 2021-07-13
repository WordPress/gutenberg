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

async function getPadding( context ) {
	return await context.evaluate( () => {
		const container = document.querySelector(
			'.wp-block-test-iframed-inline-styles'
		);
		return window.getComputedStyle( container ).padding;
	} );
}

describe( 'iframed inline styles', () => {
	beforeEach( async () => {
		await activatePlugin( 'gutenberg-test-iframed-inline-styles' );
		await createNewPost( { postType: 'page' } );
	} );

	afterEach( async () => {
		await deactivatePlugin( 'gutenberg-test-iframed-inline-styles' );
	} );

	it( 'should load inline styles in iframe', async () => {
		await insertBlock( 'Iframed Inline Styles' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
		expect( await getPadding( page ) ).toBe( '20px' );

		await openDocumentSettingsSidebar();
		await clickButton( 'Page' );
		await clickButton( 'Template' );
		await clickButton( 'New' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'Iframed Test' );
		await clickButton( 'Create' );
		await page.waitForSelector( 'iframe[name="editor-canvas"]' );
		await canvas().waitForSelector(
			'.wp-block-test-iframed-inline-styles'
		);

		expect( await getPadding( canvas() ) ).toBe( '20px' );
	} );
} );
