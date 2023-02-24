/**
 * Internal dependencies
 */
import initialHtml from '../src/initial-html';

describe( 'Gutenberg Editor Blocks test', () => {
	it( 'should be able to create a post with all blocks and scroll to the last one', async () => {
		await editorPage.setHtmlContent( initialHtml );

		// Scroll to the last element
		const addBlockPlaceholder =
			await editorPage.scrollAndReturnElementByAccessibilityId(
				'Add paragraph block'
			);

		expect( addBlockPlaceholder ).toBeTruthy();
	} );
} );
