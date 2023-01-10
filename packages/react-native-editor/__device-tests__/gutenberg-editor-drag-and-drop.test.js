/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import {
	clearClipboard,
	clickElementOutsideOfTextInput,
	dragAndDropAfterElement,
	isAndroid,
	setClipboard,
	tapPasteAboveElement,
} from './helpers/utils';
import testData from './helpers/test-data';

// Tests associated with this const are temporarily off for both platforms due to failures.
// They should be enabled for Android-only when a fix is in place.
const onlyOnAndroid = it.skip;

describe( 'Gutenberg Editor Drag & Drop blocks tests', () => {
	beforeEach( async () => {
		await clearClipboard( editorPage.driver );
	} );

	it( 'should be able to drag & drop a block', async () => {
		// Initialize the editor with a Spacer and Paragraph block
		await editorPage.setHtmlContent(
			[ testData.spacerBlock, testData.paragraphBlockShortText ].join(
				'\n\n'
			)
		);

		// Get elements for both blocks
		const spacerBlock = await editorPage.getBlockAtPosition(
			blockNames.spacer
		);
		const paragraphBlock =
			await editorPage.getParagraphBlockWrapperAtPosition( 2 );

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

		// Remove the blocks
		await spacerBlock.click();
		await editorPage.removeBlockAtPosition( blockNames.spacer, 2 );
		await editorPage.removeBlockAtPosition( blockNames.paragraph, 1 );
	} );

	onlyOnAndroid(
		'should be able to long-press on a text-based block to paste a text in a focused textinput',
		async () => {
			// Add a Paragraph block
			await editorPage.addNewBlock( blockNames.paragraph );
			const paragraphBlockElement =
				await editorPage.getTextBlockAtPosition( blockNames.paragraph );

			// Set clipboard text
			await setClipboard( editorPage.driver, testData.shortText );

			// Dismiss auto-suggestion popup
			if ( isAndroid() ) {
				// On Andrdoid 10 a new auto-suggestion popup is appearing to let the user paste text recently put in the clipboard. Let's dismiss it.
				await editorPage.dismissAndroidClipboardSmartSuggestion();
			}

			// Paste into the Paragraph block
			await tapPasteAboveElement(
				editorPage.driver,
				paragraphBlockElement
			);
			const paragraphText =
				await editorPage.getTextForParagraphBlockAtPosition( 1 );

			// Expect to have the pasted text in the Paragraph block
			expect( paragraphText ).toMatch( testData.shortText );

			// Remove the block
			await editorPage.removeBlockAtPosition( blockNames.paragraph );
		}
	);

	onlyOnAndroid(
		'should be able to long-press on a text-based block using the PlainText component to paste a text in a focused textinput',
		async () => {
			// Add a Shortcode block
			await editorPage.addNewBlock( blockNames.shortcode );
			const shortcodeBlockElement =
				await editorPage.getShortBlockTextInputAtPosition(
					blockNames.shortcode
				);

			// Set clipboard text
			await setClipboard( editorPage.driver, testData.shortText );

			// Dismiss auto-suggestion popup
			if ( isAndroid() ) {
				// On Andrdoid 10 a new auto-suggestion popup is appearing to let the user paste text recently put in the clipboard. Let's dismiss it.
				await editorPage.dismissAndroidClipboardSmartSuggestion();
			}

			// Paste into the Shortcode block
			await tapPasteAboveElement(
				editorPage.driver,
				shortcodeBlockElement
			);
			const shortcodeText = await shortcodeBlockElement.text();

			// Expect to have the pasted text in the Shortcode block
			expect( shortcodeText ).toMatch( testData.shortText );

			// Remove the block
			await editorPage.removeBlockAtPosition( blockNames.shortcode );
		}
	);

	it( 'should be able to drag & drop a text-based block when the textinput is not focused', async () => {
		// Initialize the editor with two Paragraph blocks
		await editorPage.setHtmlContent(
			[
				testData.paragraphBlockShortText,
				testData.paragraphBlockEmpty,
			].join( '\n\n' )
		);

		// Get elements for both blocks
		const firstParagraphBlock =
			await editorPage.getParagraphBlockWrapperAtPosition( 1 );
		const secondParagraphBlock =
			await editorPage.getParagraphBlockWrapperAtPosition( 2 );

		// Tap on the first Paragraph block outside of the textinput
		await clickElementOutsideOfTextInput(
			editorPage.driver,
			firstParagraphBlock
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

		// Remove the block
		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );
} );
