/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import {
	backspace,
	clickMiddleOfElement,
	clickBeginningOfElement,
	isAndroid,
	waitForMediaLibrary,
} from './helpers/utils';
import testData from './helpers/test-data';

async function isImageBlockSelected() {
	// Since there isn't an easy way to see if a block is selected,
	// it will check if the edit image button is visible
	const editImageElement = isAndroid()
		? '(//android.widget.Button[@content-desc="Edit image"])'
		: '(//XCUIElementTypeButton[@name="Edit image"])';

	return await editorPage.driver.$( editImageElement ).isDisplayed();
}

describe( 'Gutenberg Editor Writing flow tests', () => {
	it( 'should be able to write a post title', async () => {
		await editorPage.initializeEditor( { initialTitle: '' } );

		const titleElement = await editorPage.getTitleElement( {
			isEmpty: true,
		} );
		await titleElement.click();

		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );

		const titleInput = await editorPage.getEmptyTitleElement();
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
		expect(
			await editorPage.getBlockAtPosition( blockNames.image )
		).toBeTruthy();
		expect( await editorPage.driver.isKeyboardShown() ).toBe( false );
		expect( await isImageBlockSelected() ).toBe( true );

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
		await editorPage.driver.pause( 1000 );

		expect( await editorPage.driver.isKeyboardShown() ).toBe( false );
		expect( await isImageBlockSelected() ).toBe( true );
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

		// Checks that no block is select by looking for the block menu actions button
		expect( await editorPage.isBlockActionsMenuButtonDisplayed() ).toBe(
			false
		);
		expect( await editorPage.driver.isKeyboardShown() ).toBe( false );
	} );

	it( 'should dimiss the keyboard and show it back when opening modals', async () => {
		await editorPage.initializeEditor( { initialTitle: '' } );

		const defaultBlockAppenderElement =
			await editorPage.getDefaultBlockAppenderElement();
		await defaultBlockAppenderElement.click();

		await editorPage.openBlockSettings();
		await editorPage.driver.pause( 1000 );
		expect( await editorPage.driver.isKeyboardShown() ).toBe( false );

		await editorPage.dismissBottomSheet();
		await editorPage.driver.pause( 1000 );

		expect( await editorPage.driver.isKeyboardShown() ).toBe( true );
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

	it( 'should be able to split one paragraph block into two', async () => {
		await editorPage.initializeEditor();

		const defaultBlockAppenderElement =
			await editorPage.getDefaultBlockAppenderElement();
		await defaultBlockAppenderElement.click();

		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			testData.shortText
		);
		await clickMiddleOfElement( editorPage.driver, paragraphBlockElement );
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			'\n',
			false
		);
		const text0 = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		const text1 = await editorPage.getTextForParagraphBlockAtPosition( 2 );
		expect( await editorPage.getNumberOfParagraphBlocks() ).toEqual( 2 );
		expect( text0 ).not.toBe( '' );
		expect( text1 ).not.toBe( '' );
		expect( testData.shortText ).toMatch(
			new RegExp( `${ text0 + text1 }|${ text0 } ${ text1 }` )
		);
	} );

	it( 'should be able to merge 2 paragraph blocks into 1', async () => {
		await editorPage.initializeEditor();

		const defaultBlockAppenderElement =
			await editorPage.getDefaultBlockAppenderElement();
		await defaultBlockAppenderElement.click();

		let paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);

		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			testData.shortText
		);
		await clickMiddleOfElement( editorPage.driver, paragraphBlockElement );
		await editorPage.typeTextToTextBlock( paragraphBlockElement, '\n' );

		const text0 = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		const text1 = await editorPage.getTextForParagraphBlockAtPosition( 2 );
		expect( await editorPage.getNumberOfParagraphBlocks() ).toEqual( 2 );
		paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			2
		);

		await clickBeginningOfElement(
			editorPage.driver,
			paragraphBlockElement
		);

		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			backspace
		);

		const text = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		expect( text0 + text1 ).toMatch( text );
		paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			1
		);
		await paragraphBlockElement.click();
		expect( await editorPage.getNumberOfParagraphBlocks() ).toEqual( 1 );
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
} );
