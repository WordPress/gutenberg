/**
 * Internal dependencies
 */
import { otherBlocks } from '../src/initial-html';

describe( 'Gutenberg Editor Rendering Other Blocks test', () => {
	it( 'should be able to render blocks correctly', async () => {
		await editorPage.setHtmlContent( otherBlocks );

		// Scroll to the last element.
		const addBlockPlaceholder =
			await editorPage.scrollAndReturnElementByAccessibilityId(
				'Add paragraph block'
			);

		expect( addBlockPlaceholder ).toBeTruthy();
	} );
} );
