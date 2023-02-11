/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';
import { slashInserter, shortText } from './helpers/test-data';

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

		expect( await editorPage.assertSlashInserterPresent() ).toBe( true );
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

		expect( await editorPage.assertSlashInserterPresent() ).toBe( true );

		// Remove / character.
		if ( isAndroid() ) {
			await editorPage.typeTextToTextBlock(
				paragraphBlockElement,
				`${ shortText }`,
				true
			);
		} else {
			await paragraphBlockElement.type( '\b' );
			await editorPage.typeTextToTextBlock(
				paragraphBlockElement,
				`${ shortText }`,
				false
			);
		}

		// Check if the slash inserter UI no longer exists.
		expect( await editorPage.assertSlashInserterPresent() ).toBe( false );

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

		expect( await editorPage.assertSlashInserterPresent() ).toBe( true );

		// Find Image block button.
		const imageButtonElement =
			await editorPage.driver.elementByAccessibilityId( 'Image block' );
		expect( imageButtonElement ).toBeTruthy();

		// Add image block.
		await imageButtonElement.click();

		// Check image exists in the editor.
		expect(
			await editorPage.hasBlockAtPosition( 1, blockNames.image )
		).toBe( true );

		// Slash inserter UI should not be present after adding a block.
		expect( await editorPage.assertSlashInserterPresent() ).toBe( false );

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
