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

async function didMasonryLoadCorrectly( context ) {
	return await context.evaluate( () => {
		const container = document.querySelector(
			'.wp-block-test-iframed-masonry-block'
		);
		return (
			// Expect Masonry to set a non-zero height.
			parseInt( container.style.height, 10 ) > 0 &&
			// Expect Masonry to absolute position items.
			container.firstElementChild.style.position === 'absolute'
		);
	} );
}

describe( 'changing image size', () => {
	beforeEach( async () => {
		await activatePlugin( 'gutenberg-test-iframed-masonry-block' );
		await createNewPost( { postType: 'page' } );
	} );

	afterEach( async () => {
		await deactivatePlugin( 'gutenberg-test-iframed-masonry-block' );
	} );

	it( 'should load script and dependencies in iframe', async () => {
		await insertBlock( 'Iframed Masonry Block' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
		expect( await didMasonryLoadCorrectly( page ) ).toBe( true );

		await openDocumentSettingsSidebar();
		await clickButton( 'Page' );
		await clickButton( 'Template' );
		await clickButton( 'New' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'Iframed Test' );
		await clickButton( 'Create' );
		await page.waitForSelector( 'iframe[name="editor-canvas"]' );
		await canvas().waitForSelector( '.grid-item[style]' );

		expect( await didMasonryLoadCorrectly( canvas() ) ).toBe( true );
	} );
} );
