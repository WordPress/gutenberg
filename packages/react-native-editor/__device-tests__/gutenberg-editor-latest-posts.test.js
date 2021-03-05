/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor Latest Post Block tests', () => {
	it( 'should be able to add a Latests-Posts block', async () => {
		await editorPage.addNewBlock( blockNames.latestPosts );
		const latestPostsBlock = await editorPage.getBlockAtPosition(
			blockNames.latestPosts
		);

		expect( latestPostsBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.latestPosts );
	} );
} );
