/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';
import { slashInserter, shortText } from './helpers/test-data';

const ANIMATION_TIME = 200;

// helper function for asserting slash inserter presence
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

		assertSlashInserterPresent( true );

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

		assertSlashInserterPresent( true );

		// Remove / character
		if ( isAndroid() ) {
			await editorPage.typeTextToParagraphBlock(
				paragraphBlockElement,
				`${ shortText }`,
				true
			);
		} else {
			await editorPage.typeTextToParagraphBlock(
				paragraphBlockElement,
				`\b ${ shortText }`,
				false
			);
		}
		await editorPage.driver.sleep( ANIMATION_TIME );

		// Check if the slash inserter UI no longer exists
		assertSlashInserterPresent( false );

		await editorPage.removeBlockAtPosition( blockNames.paragraph );
	} );

	it( 'should add an Image block after tying /image and tapping on the Image block button', async () => {
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

		assertSlashInserterPresent( true );

		// Find Image block button
		const imageButtonElement = await editorPage.driver.elementByAccessibilityId(
			'Image block'
		);
		expect( imageButtonElement ).toBeTruthy();

		// Add image block
		await imageButtonElement.click();

		// Check image exists in the editor
		expect(
			await editorPage.hasBlockAtPosition( 1, blockNames.image )
		).toBe( true );

		// Slash inserter UI should not be present after adding a block
		assertSlashInserterPresent( false );

		// Remove image block
		await editorPage.removeBlockAtPosition( blockNames.image );
	} );

	it( 'should insert an image block with "/img" + enter', async () => {
		await editorPage.addNewBlock( blockNames.paragraph );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			'/img\n',
			false
		);
		expect(
			await editorPage.hasBlockAtPosition( 1, blockNames.image )
		).toBe( true );

		await editorPage.removeBlockAtPosition( blockNames.image );
	} );
} );
