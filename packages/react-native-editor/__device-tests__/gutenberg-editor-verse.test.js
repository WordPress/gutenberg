/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor Verse Block Tests', () => {
	it( 'should be able to add a verse block', async () => {
		await editorPage.addNewBlock( blockNames.verse );
		const verseBlock = await editorPage.getBlockAtPosition(
			blockNames.verse
		);

		expect( verseBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.verse );
	} );
} );
