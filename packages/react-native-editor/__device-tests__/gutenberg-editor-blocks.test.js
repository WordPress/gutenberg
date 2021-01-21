/**
 * Internal dependencies
 */
import initialHtml from '../src/initial-html';
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor Blocks test', () => {
	it( 'should be able to create a post with all blocks and scroll to the last one', async () => {
		await editorPage.setHtmlContent( initialHtml );

		await editorPage.addNewBlock( blockNames.paragraph );

		await editorPage.driver.sleep( 5000 ); // wait the scroll to paragraph block
	} );
} );
