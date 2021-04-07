/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';

describe( 'Gutenberg Editor tests for slash inserter', () => {
	it( 'should insert an image block with "/img" + enter', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			'/img\n',
			false
		);
		expect(
			await editorPage.hasBlockAtPosition( 1, blockNames.image )
		).toBe( true );

		await editorPage.removeBlockAtPosition( blockNames.image );
	} );
} );
