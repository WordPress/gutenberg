/**
 * Internal dependencies
 */
import { mediaBlocks } from '../src/initial-html';

describe( 'Gutenberg Editor Rendering Media Blocks test', () => {
	it( 'should be able to render blocks correctly', async () => {
		await editorPage.initializeEditor( { initialData: mediaBlocks } );

		// Give some time to media placeholders to render.
		await editorPage.driver.pause( 3000 );

		// Scroll to the last element.
		const addBlockPlaceholder =
			await editorPage.scrollAndReturnElementByAccessibilityId(
				'Add paragraph block'
			);

		expect( addBlockPlaceholder ).toBeTruthy();
	} );
} );
