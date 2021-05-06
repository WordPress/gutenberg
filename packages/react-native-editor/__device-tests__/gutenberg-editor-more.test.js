/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor Spacer Block test', () => {
	it( 'should be able to add an separator block', async () => {
		await editorPage.addNewBlock( blockNames.more );
		const separatorBlock = await editorPage.getBlockAtPosition(
			blockNames.more
		);

		expect( separatorBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.more );
	} );
} );
