/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import {
	backspace,
	clickBeginningOfElement,
	waitForMediaLibrary,
} from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor Writing flow tests', () => {
	it( 'should be able to write a post title', async () => {
		await editorPage.initializeEditor( { initialTitle: '' } );

		const titleInput = await editorPage.getEmptyTitleTextInputElement();
		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );
		await editorPage.typeTextToTextBlock( titleInput, testData.shortText );

		// Trigger the return key to go to the first Paragraph
		await editorPage.typeTextToTextBlock( titleInput, '\n' );

		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);
		expect( paragraphBlockElement ).toBeTruthy();
		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );

		// Trigger the return key to delete the Paragraph block
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			backspace
		);
		// Expect to have an empty Paragraph block and the keyboard visible
		expect(
			await editorPage.getTextBlockAtPosition( blockNames.paragraph )
		).toBeTruthy();
		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );
	} );

	it( 'should be able to create a new Paragraph block when pressing the enter key', async () => {
		await editorPage.initializeEditor( { initialTitle: '' } );

		const defaultBlockAppenderElement =
			await editorPage.getDefaultBlockAppenderElement();
		await defaultBlockAppenderElement.click();

		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);
		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );

		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			testData.shortText
		);
		await editorPage.typeTextToTextBlock( paragraphBlockElement, '\n' );

		// Expect to have a new Paragraph block and the keyboard visible
		expect(
			await editorPage.getTextBlockAtPosition( blockNames.paragraph, 2 )
		).toBeTruthy();
		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );
	} );

	it( 'should automatically dismiss the keyboard when selecting non-text-based-blocks', async () => {
		await editorPage.initializeEditor( { initialTitle: '' } );

		await editorPage.addNewBlock( blockNames.image );
		// Wait for the Media picker to show up
		await waitForMediaLibrary( editorPage.driver );

		// Select the WordPress Media Library option
		await editorPage.chooseMediaLibrary();

		// Wait until the media is added
		await editorPage.driver.pause( 500 );

		const captionElement = await editorPage.getImageBlockCaptionButton();
		await captionElement.click();
		const captionInput =
			await editorPage.getImageBlockCaptionInput( captionElement );

		expect( captionInput ).toBeTruthy();
		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );

		// Sets a new caption
		await editorPage.typeTextToTextBlock(
			captionInput,
			testData.listItem2,
			true
		);

		// Trigger the return key to exit the caption and create a new Paragraph block
		await editorPage.typeTextToTextBlock( captionInput, '\n' );

		// Expect to have an empty Paragraph block and the keyboard visible
		let paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			2
		);
		expect( paragraphBlockElement ).toBeTruthy();
		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			backspace
		);

		// When deleting the Paragraph block, the keyboard should be hidden and
		// the image block should be focused.
		await editorPage.driver.waitUntil( async function () {
			return ! ( await editorPage.driver.isKeyboardShown() );
		} );
		expect( await editorPage.isImageBlockSelected() ).toBe( true );

		// Adding a new Paragraph block
		await editorPage.addNewBlock( blockNames.paragraph );
		paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			2
		);

		// It should be focused and the keyboard should be visible
		expect( paragraphBlockElement ).toBeTruthy();
		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );

		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			testData.shortText
		);

		const imageBlockElement = await editorPage.getBlockAtPosition(
			blockNames.image
		);
		await imageBlockElement.click();

		await editorPage.driver.waitUntil( async function () {
			return ! ( await editorPage.driver.isKeyboardShown() );
		} );
		expect( await editorPage.isImageBlockSelected() ).toBe( true );
	} );

	it( 'should manually dismiss the keyboard', async () => {
		await editorPage.initializeEditor( { initialTitle: '' } );

		const defaultBlockAppenderElement =
			await editorPage.getDefaultBlockAppenderElement();
		await defaultBlockAppenderElement.click();

		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);
		expect( paragraphBlockElement ).toBeTruthy();
		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );

		await editorPage.dismissKeyboard();

		// Checks that no block is selected by looking for the block menu actions button
		expect( await editorPage.isBlockActionsMenuButtonDisplayed() ).toBe(
			false
		);
		expect( await editorPage.driver.isKeyboardShown() ).toBe( false );
	} );

	it( 'should dismiss the keyboard and show it back when opening modals', async () => {
		await editorPage.initializeEditor( { initialTitle: '' } );

		const defaultBlockAppenderElement =
			await editorPage.getDefaultBlockAppenderElement();
		await defaultBlockAppenderElement.click();

		await editorPage.openBlockSettings();
		await editorPage.driver.waitUntil( async function () {
			return ! ( await editorPage.driver.isKeyboardShown() );
		} );

		await editorPage.dismissBottomSheet();

		await editorPage.driver.waitUntil( editorPage.driver.isKeyboardShown );
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			testData.listItem1
		);
		const typedText = await paragraphBlockElement.getText();
		expect( typedText ).toMatch( testData.listItem1 );
	} );

	it( 'should be able to split and merge paragraph blocks', async () => {
		await editorPage.initializeEditor();

		// Add the first Paragraph block using the default block appender
		const defaultBlockAppenderElement =
			await editorPage.getDefaultBlockAppenderElement();
		await defaultBlockAppenderElement.click();

		// Type text into the first Paragraph block
		const firstParagraphBlockElement =
			await editorPage.getTextBlockAtPosition( blockNames.paragraph );
		await editorPage.typeTextToTextBlock(
			firstParagraphBlockElement,
			testData.shortText
		);

		// Add a second Paragraph block and type some text
		await editorPage.addParagraphBlockByTappingEmptyAreaBelowLastBlock();
		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );
		const secondParagraphBlockElement =
			await editorPage.getTextBlockAtPosition( blockNames.paragraph, 2 );
		await editorPage.typeTextToTextBlock(
			secondParagraphBlockElement,
			testData.mediumText
		);

		// Merge Paragraph blocks
		await clickBeginningOfElement(
			editorPage.driver,
			secondParagraphBlockElement
		);
		await editorPage.typeTextToTextBlock(
			secondParagraphBlockElement,
			backspace
		);

		// Wait for blocks to be merged
		await editorPage.driver.waitUntil( async function () {
			return ( await editorPage.getNumberOfParagraphBlocks() ) === 1;
		} );
		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );

		// Split the current Paragraph block right where the caret is positioned
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			1,
			true
		);
		await editorPage.typeTextToTextBlock( paragraphBlockElement, '\n' );

		// Wait for blocks to be split
		await editorPage.driver.waitUntil( async function () {
			return ( await editorPage.getNumberOfParagraphBlocks() ) === 2;
		} );
		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );

		const firstParagraphText =
			await editorPage.getTextForParagraphBlockAtPosition( 1 );
		const secondParagraphText =
			await editorPage.getTextForParagraphBlockAtPosition( 2 );

		expect( firstParagraphText ).toEqual( testData.shortText );
		expect( secondParagraphText ).toEqual( testData.mediumText );
	} );

	it( 'should be able to create a post with multiple paragraph blocks', async () => {
		await editorPage.initializeEditor();
		const defaultBlockAppenderElement =
			await editorPage.getDefaultBlockAppenderElement();
		await defaultBlockAppenderElement.click();

		await editorPage.sendTextToParagraphBlock( 1, testData.longText );
		expect( await editorPage.getNumberOfParagraphBlocks() ).toEqual( 3 );
	} );

	it( 'should be able to merge blocks with unknown html elements', async () => {
		await editorPage.initializeEditor( {
			initialData: [
				testData.unknownElementParagraphBlock,
				testData.lettersInParagraphBlock,
			].join( '\n\n' ),
		} );

		// Merge paragraphs.
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			2
		);

		const text0 = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		const text1 = await editorPage.getTextForParagraphBlockAtPosition( 2 );

		await clickBeginningOfElement(
			editorPage.driver,
			paragraphBlockElement
		);
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			backspace
		);

		// Verify the editor has not crashed.
		const mergedBlockText =
			await editorPage.getTextForParagraphBlockAtPosition( 1 );
		expect( text0 + text1 ).toMatch( mergedBlockText );
	} );

	it( 'should be able to create a post with heading and paragraph blocks', async () => {
		await editorPage.initializeEditor();
		await editorPage.addNewBlock( blockNames.heading );
		const headingBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.heading
		);

		await editorPage.typeTextToTextBlock(
			headingBlockElement,
			testData.heading
		);

		await editorPage.addParagraphBlockByTappingEmptyAreaBelowLastBlock();
		let paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			2
		);
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			testData.mediumText
		);

		await editorPage.addParagraphBlockByTappingEmptyAreaBelowLastBlock();
		paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			3
		);
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			testData.mediumText
		);

		// Assert that even though there are 3 blocks, there should only be 2 paragraph blocks
		expect( await editorPage.getNumberOfParagraphBlocks() ).toEqual( 2 );
	} );
} );
