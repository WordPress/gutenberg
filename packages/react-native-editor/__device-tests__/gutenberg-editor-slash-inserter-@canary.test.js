/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid, backspace, clickBeginningOfElement } from './helpers/utils';
import {
	slashInserter,
	shortText,
	imagePlaceholderHtml,
} from './helpers/test-data';

const ANIMATION_TIME = 200;

describe( 'Gutenberg Editor Slash Inserter tests', () => {
	it( 'should show the menu after typing /', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			slashInserter
		);
		await editorPage.driver.sleep( ANIMATION_TIME );

		// Slash inserter
		const slashInserterElement = await editorPage.driver.elementByAccessibilityId(
			'Slash inserter results'
		);
		expect( slashInserterElement ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );

	it( 'should hide the menu after deleting the / character', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			slashInserter
		);
		await editorPage.driver.sleep( ANIMATION_TIME );

		// Slash inserter
		const slashInserterElement = await editorPage.driver.elementByAccessibilityId(
			'Slash inserter results'
		);
		expect( slashInserterElement ).toBeTruthy();

		// Remove / character
		await clickBeginningOfElement(
			editorPage.driver,
			paragraphBlockElement
		);
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			shortText + backspace,
			true
		);
		await editorPage.driver.sleep( ANIMATION_TIME );

		// Check if the slash inserter UI exists
		const foundElements = await editorPage.driver.elementsByAccessibilityId(
			'Slash inserter results'
		);
		expect( foundElements.length ).toBe( 0 );

		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );

	it( 'should add an Image block after tying /image', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			`${ slashInserter }image`
		);
		await editorPage.driver.sleep( ANIMATION_TIME );

		// Slash inserter
		const slashInserterElement = await editorPage.driver.elementByAccessibilityId(
			'Slash inserter results'
		);
		expect( slashInserterElement ).toBeTruthy();

		// Find Image block button
		const imageButtonElement = await editorPage.driver.elementByAccessibilityId(
			'Image block'
		);
		expect( imageButtonElement ).toBeTruthy();

		// Add image block
		await imageButtonElement.click();

		// Check image block content in the editor
		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe( imagePlaceholderHtml.toLowerCase() );

		// Slash inserter UI should not be present after adding a block
		const foundElements = await editorPage.driver.elementsByAccessibilityId(
			'Slash inserter results'
		);
		expect( foundElements.length ).toBe( 0 );

		// Remove image block
		const imageBlock = await editorPage.getBlockAtPosition(
			blockNames.image
		);
		await imageBlock.click();
		await editorPage.driver.sleep( 1000 );
		await editorPage.closePicker();
		await editorPage.removeBlockAtPosition( blockNames.image );
	} );
} );
