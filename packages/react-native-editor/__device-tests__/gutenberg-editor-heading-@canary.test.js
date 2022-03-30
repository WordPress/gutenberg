/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor tests', () => {
	it( 'should be able to create a post with heading and paragraph blocks', async () => {
		let block;
		let paragraphBlockElement;
		let textViewElement;

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
		paragraphBlockElement = await editorPage.getTextBlockLocatorAtPosition(
			blockNames.paragraph,
			2
		);

		// Extra step for iOS only
		if ( ! isAndroid() ) {
			textViewElement = await editorPage.getTextViewForParagraphBlock(
				paragraphBlockElement
			);
		}

		block = isAndroid() ? paragraphBlockElement : textViewElement;

		await editorPage.typeTextToParagraphBlock( block, testData.mediumText );

		await editorPage.addNewBlock( blockNames.paragraph );
		paragraphBlockElement = await editorPage.getTextBlockLocatorAtPosition(
			blockNames.paragraph,
			3
		);

		// Extra step for iOS only
		if ( ! isAndroid() ) {
			textViewElement = await editorPage.getTextViewForParagraphBlock(
				paragraphBlockElement
			);
		}

		block = isAndroid() ? paragraphBlockElement : textViewElement;

		await editorPage.typeTextToParagraphBlock( block, testData.mediumText );

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

		// Extra step for iOS only
		if ( ! isAndroid() ) {
			textViewElement = await editorPage.getTextViewForParagraphBlock(
				paragraphBlockElement
			);
		}

		block = isAndroid() ? paragraphBlockElement : textViewElement;

		await editorPage.typeTextToParagraphBlock( block, testData.mediumText );
	} );
} );
