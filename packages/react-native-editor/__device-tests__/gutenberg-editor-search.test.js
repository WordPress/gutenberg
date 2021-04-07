/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor Search Block tests', () => {
	it( 'should be able to add a Search block', async () => {
		await editorPage.addNewBlock( blockNames.search );
		const searchBlock = await editorPage.getBlockAtPosition(
			blockNames.search
		);

		expect( searchBlock ).toBeTruthy();
	} );
} );
