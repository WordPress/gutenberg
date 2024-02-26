/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { dragAndDropAfterElement } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor Drag & Drop blocks tests', () => {
	it( 'should be able to drag & drop a block', async () => {
		// Initialize the editor with a Spacer and Paragraph block
		await editorPage.initializeEditor( {
			initialData: [
				testData.spacerBlock,
				testData.paragraphBlockShortText,
			].join( '\n\n' ),
		} );

		// Get elements for both blocks
		const spacerBlock = await editorPage.getBlockAtPosition(
			blockNames.spacer
		);
		const paragraphBlock = await editorPage.getBlockAtPosition(
			blockNames.paragraph,
			2
		);

		// Drag & drop the Spacer block after the Paragraph block
		await dragAndDropAfterElement(
			editorPage.driver,
			spacerBlock,
			paragraphBlock
		);

		// Get the first block, in this case the Paragraph block
		// and check the text value is the expected one
		const firstBlockText =
			await editorPage.getTextForParagraphBlockAtPosition( 1 );
		expect( firstBlockText ).toMatch( testData.shortText );
	} );

	it( 'should be able to drag & drop a text-based block when another textinput is focused', async () => {
		// Initialize the editor with two Paragraph blocks
		await editorPage.initializeEditor( {
			initialData: [
				testData.paragraphBlockShortText,
				testData.paragraphBlockEmpty,
			].join( '\n\n' ),
		} );

		// Tap on the second block
		const secondParagraphBlock = await editorPage.getBlockAtPosition(
			blockNames.paragraph,
			2
		);
		await secondParagraphBlock.click();

		const firstParagraphBlock = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);

		// Drag & drop the first Paragraph block after the second Paragraph block
		await dragAndDropAfterElement(
			editorPage.driver,
			firstParagraphBlock,
			secondParagraphBlock
		);

		// Get the current second Paragraph block in the editor after dragging & dropping
		const secondBlockText =
			await editorPage.getTextForParagraphBlockAtPosition( 2 );

		// Expect the second Paragraph block to have the expected content
		expect( secondBlockText ).toMatch( testData.shortText );
	} );
} );
