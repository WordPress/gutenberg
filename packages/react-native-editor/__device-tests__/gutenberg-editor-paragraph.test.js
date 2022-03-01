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
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.shortText
		);
		const textViewElement = await editorPage.getTextViewForParagraphBlock(
			paragraphBlockElement
		);
		await clickMiddleOfElement( editorPage.driver, textViewElement );
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			'\n',
			false
		);
		expect(
			( await editorPage.hasBlockAtPosition(
				1,
				blockNames.paragraph
			) ) &&
				( await editorPage.hasBlockAtPosition(
					2,
					blockNames.paragraph
				) )
		).toBe( true );

		const text0 = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		const text1 = await editorPage.getTextForParagraphBlockAtPosition( 2 );
		expect( text0 ).not.toBe( '' );
		expect( text1 ).not.toBe( '' );
		expect( testData.shortText ).toMatch(
			new RegExp( `${ text0 + text1 }|${ text0 } ${ text1 }` )
		);

		await editorPage.removeBlockAtPosition( blockNames.paragraph, 2 );
		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );

	it( 'should be able to merge 2 paragraph blocks into 1', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		let paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.shortText
		);
		let textViewElement = await editorPage.getTextViewForParagraphBlock(
			paragraphBlockElement
		);
		await clickMiddleOfElement( editorPage.driver, textViewElement );
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			'\n'
		);
		expect(
			( await editorPage.hasBlockAtPosition(
				1,
				blockNames.paragraph
			) ) &&
				( await editorPage.hasBlockAtPosition(
					2,
					blockNames.paragraph
				) )
		).toBe( true );

		const text0 = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		const text1 = await editorPage.getTextForParagraphBlockAtPosition( 2 );
		paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph,
			2
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		textViewElement = await editorPage.getTextViewForParagraphBlock(
			paragraphBlockElement
		);
		await clickBeginningOfElement( editorPage.driver, textViewElement );
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			backspace
		);

		const text = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		expect( text0 + text1 ).toMatch( text );

		expect(
			await editorPage.hasBlockAtPosition( 2, blockNames.paragraph )
		).toBe( false );
		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );

	it( 'should be able to create a post with multiple paragraph blocks', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.sendTextToParagraphBlock( 1, testData.longText );

		for ( let i = 3; i > 0; i-- ) {
			await editorPage.removeBlockAtPosition( blockNames.paragraph, i );
		}
	} );

	it( 'should be able to merge blocks with unknown html elements', async () => {
		await editorPage.setHtmlContent( `
<!-- wp:paragraph -->
<p><unknownhtmlelement>abc</unknownhtmlelement>D</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>E</p>
<!-- /wp:paragraph -->` );

		// // Merge paragraphs
		const secondParagraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph,
			2
		);
		await clickBeginningOfElement(
			editorPage.driver,
			secondParagraphBlockElement
		);
		await editorPage.typeTextToParagraphBlock(
			secondParagraphBlockElement,
			backspace
		);

		// verify the editor has not crashed
		const text = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		expect( text.length ).not.toEqual( 0 );

		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );

	// Based on https://github.com/wordpress-mobile/gutenberg-mobile/pull/1507
	it( 'should handle multiline paragraphs from web', async () => {
		await editorPage.setHtmlContent( `
<!-- wp:paragraph -->
<p>multiple lines<br><br></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->` );

		// // Merge paragraphs
		const secondParagraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph,
			2
		);
		await secondParagraphBlockElement.click();
		await editorPage.typeTextToParagraphBlock(
			secondParagraphBlockElement,
			backspace
		);

		// verify the editor has not crashed
		const text = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		expect( text.length ).not.toEqual( 0 );

		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );
} );
