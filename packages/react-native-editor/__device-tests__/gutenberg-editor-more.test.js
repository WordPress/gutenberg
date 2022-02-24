/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor More Block test', () => {
	it( 'should be able to add a more block', async () => {
		await editorPage.addNewBlock( blockNames.more );
		const moreBlock = await editorPage.getBlockAtPosition(
			blockNames.more
		);

		expect( moreBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.more );
	} );
} );
 