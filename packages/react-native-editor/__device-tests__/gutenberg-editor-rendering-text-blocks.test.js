/**
 * Internal dependencies
 */
import { textBlocks } from '../src/initial-html';

describe( 'Gutenberg Editor Rendering Blocks test', () => {
	it( 'should be able to set content with text blocks', async () => {
		await editorPage.setHtmlContent( textBlocks );

		// Scroll to the last element
		const addBlockPlaceholder =
			await editorPage.scrollAndReturnElementByAccessibilityId(
				'Add paragraph block'
			);

		expect( addBlockPlaceholder ).toBeTruthy();
	} );
} );
