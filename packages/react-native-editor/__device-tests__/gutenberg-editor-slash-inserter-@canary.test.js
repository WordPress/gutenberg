/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';
import { slashInserter, shortText } from './helpers/test-data';

// Helper function for asserting slash inserter presence.
async function assertSlashInserterPresent( checkIsVisible ) {
	let areResultsDisplayed;
	try {
		const foundElements = await editorPage.driver.elementsByAccessibilityId(
			'Slash inserter results'
		);
		areResultsDisplayed = !! foundElements.length;
	} catch ( e ) {
		areResultsDisplayed = false;
	}
	if ( checkIsVisible ) {
		expect( areResultsDisplayed ).toBeTruthy();
	} else {
		expect( areResultsDisplayed ).toBeFalsy();
	}
}

describe( 'Gutenberg Editor Slash Inserter tests', () => {
	it( 'should show the menu after typing /', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);

		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			slashInserter
		);

		assertSlashInserterPresent( true );

		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );

	it( 'should hide the menu after deleting the / character', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);

		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			slashInserter
		);

		assertSlashInserterPresent( true );

		// Remove / character.
		if ( isAndroid() ) {
			await editorPage.typeTextToTextBlock(
				paragraphBlockElement,
				`${ shortText }`,
				true
			);
		} else {
			await editorPage.typeTextToTextBlock(
				paragraphBlockElement,
				`\b ${ shortText }`,
				false
			);
		}

		// Check if the slash inserter UI no longer exists.
		assertSlashInserterPresent( false );

		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );

	it( 'should add an Image block after tying /image and tapping on the Image block button', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);

		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			`${ slashInserter }image`
		);

		assertSlashInserterPresent( true );

		// Find Image block button.
		const imageButtonElement = await editorPage.driver.elementByAccessibilityId(
			'Image block'
		);
		expect( imageButtonElement ).toBeTruthy();

		// Add image block.
		await imageButtonElement.click();

		// Check image exists in the editor.
		expect(
			await editorPage.hasBlockAtPosition( 1, blockNames.image )
		).toBe( true );

		// Slash inserter UI should not be present after adding a block.
		assertSlashInserterPresent( false );

		// Remove image block.
		await editorPage.removeBlockAtPosition( blockNames.image );
	} );

	it( 'should insert an embed image block with "/img" + enter', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getTextBlockAtPosition(
			blockNames.paragraph
		);

		await editorPage.typeTextToTextBlock(
			paragraphBlockElement,
			'/img\n',
			false
		);
		expect(
			await editorPage.hasBlockAtPosition( 1, blockNames.embed )
		).toBe( true );

		await editorPage.removeBlockAtPosition( blockNames.embed );
	} );
} );
