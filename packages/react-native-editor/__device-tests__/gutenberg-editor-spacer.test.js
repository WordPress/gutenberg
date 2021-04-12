/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor Spacer Block test', () => {
	it( 'should be able to add an separator block', async () => {
		await editorPage.addNewBlock( blockNames.spacer );
		const separatorBlock = await editorPage.getBlockAtPosition(
			blockNames.spacer
		);

		expect( separatorBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.spacer );
	} );
} );
