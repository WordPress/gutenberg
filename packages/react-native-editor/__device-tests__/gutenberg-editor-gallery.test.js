/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor Gallery Block tests', () => {
	it( 'should be able to add a gallery block', async () => {
		await editorPage.addNewBlock( blockNames.gallery );
		await editorPage.driver.sleep( 1000 );
		await editorPage.closePicker();

		const galleryBlock = await editorPage.getBlockAtPosition(
			blockNames.gallery
		);

		expect( galleryBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.gallery );
	} );
} );
