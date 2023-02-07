/**
 * Internal dependencies
 */
import { mediaBlocks } from '../src/initial-html';

describe( 'Gutenberg Editor Rendering Blocks test', () => {
	it( 'should be able to set content with media blocks', async () => {
		await editorPage.setHtmlContent( mediaBlocks );

		// Give some time to media placeholders to render.
		await editorPage.driver.sleep( 3000 );

		// Scroll to the last element.
		const addBlockPlaceholder =
			await editorPage.scrollAndReturnElementByAccessibilityId(
				'Add paragraph block'
			);

		expect( addBlockPlaceholder ).toBeTruthy();
	} );
} );
