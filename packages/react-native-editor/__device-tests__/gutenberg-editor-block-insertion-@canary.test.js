/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';
import testData, { slashInserter, shortText } from './helpers/test-data';

describe( 'Gutenberg Editor tests for Block insertion', () => {
	it( 'should be able to insert multi-paragraph text, and text to another paragraph block in between', async () => {
		await editorPage.initializeEditor();
		await editorPage.addNewBlock( blockNames.paragraph );
		let paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.sendTextToParagraphBlock( 1, testData.longText );
		// Should have 3 paragraph blocks at this point.

		paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			2
		);
		await paragraphBlockElement.click();

		await editorPage.addNewBlock( blockNames.paragraph );

		paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			3
		);
		await paragraphBlockElement.click();
		await editorPage.sendTextToParagraphBlock( 3, testData.mediumText );

		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			testData.blockInsertionHtml.toLowerCase()
		);
	} );

	it( 'should be able to insert block at the beginning of post from the title', async () => {
		await editorPage.initializeEditor();
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.sendTextToParagraphBlock( 1, testData.longText );
		// Should have 3 paragraph blocks at this point.

		const titleElement = await editorPage.getTitleElement( {
			autoscroll: true,
		} );
		await titleElement.click();

		// Wait for editor to finish scrolling to the title
		await editorPage.driver.pause( 2000 );

		await editorPage.addNewBlock( blockNames.paragraph );
		const emptyParagraphBlock = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		expect( emptyParagraphBlock ).toBeTruthy();

		await editorPage.sendTextToParagraphBlock( 1, testData.mediumText );
		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe(
			testData.blockInsertionHtmlFromTitle.toLowerCase()
		);
	} );
} );

describe( 'Gutenberg Editor Slash Inserter tests', () => {
	it( 'should show the menu after typing /', async () => {
		await editorPage.initializeEditor();
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);

		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			slashInserter
		);

		expect( await editorPage.assertSlashInserterPresent() ).toBe( true );
	} );

	it( 'should hide the menu after deleting the / character', async () => {
		await editorPage.initializeEditor();
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);

		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			slashInserter
		);

		expect( await editorPage.assertSlashInserterPresent() ).toBe( true );

		// Remove / character.
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			`${ shortText }`,
			true
		);

		// Check if the slash inserter UI no longer exists.
		expect( await editorPage.assertSlashInserterPresent() ).toBe( false );
	} );

	it( 'should add an Image block after tying /image and tapping on the Image block button', async () => {
		await editorPage.initializeEditor();
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);

		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			`${ slashInserter }image`
		);

		expect( await editorPage.assertSlashInserterPresent() ).toBe( true );

		// Find Image block button.
		const imageButtonElement = await editorPage.driver.$( '~Image block' );
		expect( imageButtonElement ).toBeTruthy();

		// Add image block.
		await imageButtonElement.click();

		// Check image exists in the editor.
		expect(
			await editorPage.hasBlockAtPosition( 1, blockNames.image )
		).toBe( true );

		// Slash inserter UI should not be present after adding a block.
		expect( await editorPage.assertSlashInserterPresent() ).toBe( false );
	} );

	it( 'should insert an embed image block with "/img" + enter', async () => {
		await editorPage.initializeEditor();
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);

		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			'/img',
			false
		);
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			'\n',
			false
		);
		expect(
			await editorPage.hasBlockAtPosition( 1, blockNames.embed )
		).toBe( true );
	} );
} );
