/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor Columns Block test', () => {
	it( 'should be able to handle a columns width unit from web', async () => {
		await editorPage.setHtmlContent(
			testData.columnsWithDifferentUnitsHtml
		);

		const columnsBlock = await editorPage.getFirstBlockVisible();
		await columnsBlock.click();

		expect( columnsBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.columns );
	} );
} );
