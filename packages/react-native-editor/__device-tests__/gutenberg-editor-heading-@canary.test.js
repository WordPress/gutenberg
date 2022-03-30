/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor tests', () => {
	it( 'should be able to create a post with heading and paragraph blocks', async () => {
		await editorPage.addNewBlock( blockNames.heading );
		let headingBlockElement = await editorPage.getBlockAtPosition(
			blockNames.heading
		);
		if ( isAndroid() ) {
			await headingBlockElement.click();
		}
		await editorPage.sendTextToHeadingBlock(
			headingBlockElement,
			testData.heading,
			false
		);

		await editorPage.addNewBlock( blockNames.paragraph );
		let paragraphBlockElement = await editorPage.getTextBlockLocatorAtPosition(
			blockNames.paragraph,
			2
		);

		if ( ! isAndroid() ) {
			await editorPage.clickBlockParagraphAtPosition( 2 )
		}

		await editorPage.typeTextToParagraphBlock( paragraphBlockElement, testData.mediumText );

		await editorPage.addNewBlock( blockNames.paragraph );
		paragraphBlockElement = await editorPage.getTextBlockLocatorAtPosition(
			blockNames.paragraph,
			3
		);

		if ( ! isAndroid() ) {
			await editorPage.clickBlockParagraphAtPosition( 3 )
		}

		await editorPage.typeTextToParagraphBlock( paragraphBlockElement, testData.mediumText );

		await editorPage.addNewBlock( blockNames.heading );
		headingBlockElement = await editorPage.getTextBlockLocatorAtPosition(
			blockNames.heading,
			4
		);
		await editorPage.typeTextToParagraphBlock(
			headingBlockElement,
			testData.heading
		);

		await editorPage.addNewBlock( blockNames.paragraph );
		paragraphBlockElement = await editorPage.getTextBlockLocatorAtPosition(
			blockNames.paragraph,
			5
		);

		if ( ! isAndroid() ) {
			await editorPage.clickBlockParagraphAtPosition( 5 )
		}

		await editorPage.typeTextToParagraphBlock( paragraphBlockElement, testData.mediumText );
	} );
} );
