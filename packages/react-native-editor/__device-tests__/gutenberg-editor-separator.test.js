/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor Separator Block test', () => {
	it( 'should be able to add a separator block', async () => {
		await editorPage.addNewBlock( blockNames.separator );
		const separatorBlock = await editorPage.getBlockAtPosition(
			blockNames.separator
		);

		expect( separatorBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.separator );
	} );
} );
