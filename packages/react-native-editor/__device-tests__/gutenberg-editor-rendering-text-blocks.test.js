/**
 * Internal dependencies
 */
import { textBlocks } from '../src/initial-html';

describe( 'Gutenberg Editor Rendering Text Blocks test', () => {
	it( 'should be able to render blocks correctly', async () => {
		await editorPage.initializeEditor( { initialData: textBlocks } );

		// Scroll to the last element
		const addBlockPlaceholder =
			await editorPage.scrollAndReturnElementByAccessibilityId(
				'Add paragraph block'
			);

		expect( addBlockPlaceholder ).toBeTruthy();
	} );
} );
