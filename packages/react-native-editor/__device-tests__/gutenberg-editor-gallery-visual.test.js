/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor Visual test for Gallery Block', () => {
	it( 'should be able to render the placeholder correctly', async () => {
		await editorPage.addNewBlock( blockNames.gallery );

		await editorPage.closePicker();
		const emptyGalleryBlock = await editorPage.getBlockAtPosition(
			blockNames.gallery
		);
		expect( emptyGalleryBlock ).toBeTruthy();

		// Visual test check
		const screenshot = await editorPage.takeScreenshot();
		expect( screenshot ).toMatchImageSnapshot();

		await editorPage.removeBlockAtPosition( blockNames.gallery );
	} );

	it( 'should be able to render a gallery correctly', async () => {
		await editorPage.setHtmlContent(
			[ testData.galleryBlock ].join( '\n\n' )
		);
		const galleryBlock = await editorPage.getBlockAtPosition(
			blockNames.gallery
		);
		expect( galleryBlock ).toBeTruthy();

		// Wait for images to load
		await editorPage.driver.sleep( 5000 );

		// Visual test check
		const screenshot = await editorPage.takeScreenshot();
		expect( screenshot ).toMatchImageSnapshot();
	} );
} );
