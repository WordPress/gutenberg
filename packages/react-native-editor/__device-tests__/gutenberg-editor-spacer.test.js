/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor Spacer Block test', () => {
	it( 'should be able to add a spacer block', async () => {
		await editorPage.addNewBlock( blockNames.spacer );
		const spacerBlock = await editorPage.getBlockAtPosition(
			blockNames.spacer
		);

		expect( spacerBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.spacer );
	} );
} );
