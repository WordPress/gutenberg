/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor tests', () => {
	it( 'should be able to create a post with heading and paragraph blocks', async () => {
		await editorPage.initializeEditor();
		await editorPage.addNewBlock( blockNames.heading );
		let headingBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.heading
		);

		await editorPage.typeTextToTextBlock(
			headingBlockElement,
			testData.heading
		);

		await editorPage.addNewBlock( blockNames.paragraph );
		let paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			2
		);
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			testData.mediumText
		);

		await editorPage.addNewBlock( blockNames.paragraph );
		paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			3
		);
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			testData.mediumText
		);

		await editorPage.addNewBlock( blockNames.heading );
		headingBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.heading,
			4
		);
		await editorPage.typeTextToTextBlock(
			headingBlockElement,
			testData.heading
		);

		await editorPage.addNewBlock( blockNames.paragraph );
		paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			5
		);
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			testData.mediumText
		);

		// Assert that even though there are 5 blocks, there should only be 3 paragraph blocks
		expect( await editorPage.getNumberOfParagraphBlocks() ).toEqual( 3 );
	} );
} );
