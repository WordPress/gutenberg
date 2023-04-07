/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import {
	backspace,
	clickMiddleOfElement,
	clickBeginningOfElement,
	isAndroid,
} from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor tests for Paragraph Block', () => {
	it( 'should be able to split one paragraph block into two', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
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

		await editorPage.removeBlock();
		await editorPage.removeBlock();
	} );

	it( 'should be able to merge 2 paragraph blocks into 1', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
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
		await editorPage.removeBlock();
	} );

	it( 'should be able to create a post with multiple paragraph blocks', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		await editorPage.sendTextToParagraphBlock( 1, testData.longText );

		for ( let i = 3; i > 0; i-- ) {
			await editorPage.removeBlock();
		}
	} );

	it( 'should be able to merge blocks with unknown html elements', async () => {
		await editorPage.setHtmlContent(
			[
				testData.unknownElementParagraphBlock,
				testData.lettersInParagraphBlock,
			].join( '\n\n' )
		);

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

		await editorPage.removeBlock();
	} );

	// Based on https://github.com/wordpress-mobile/gutenberg-mobile/pull/1507
	it( 'should handle multiline paragraphs from web', async () => {
		await editorPage.setHtmlContent(
			[
				testData.multiLinesParagraphBlock,
				testData.paragraphBlockEmpty,
			].join( '\n\n' )
		);

		// Merge paragraphs.
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph,
			2
		);
		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			backspace
		);

		// Verify the editor has not crashed.
		const text = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		expect( text.length ).not.toEqual( 0 );

		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}
		await editorPage.removeBlock();
	} );
} );
