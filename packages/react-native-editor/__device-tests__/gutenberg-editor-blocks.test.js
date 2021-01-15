/**
 * Internal dependencies
 */
import initialHtml from '../src/initial-html';

describe( 'Gutenberg Editor Blocks test', () => {
	it( 'should be able to create a post with all blocks and scroll to the last one', async () => {
		const lastBlockAccessibilityLabel = 'Heading with line-height set';
		await editorPage.setHtmlContent( initialHtml );

		const lastBlockElement = await editorPage.scrollAndReturnElement(
			lastBlockAccessibilityLabel
		);

		expect( lastBlockElement ).toBeTruthy();
	} );
} );
