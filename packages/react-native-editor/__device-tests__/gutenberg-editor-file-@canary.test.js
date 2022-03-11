/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor File Block tests', () => {
	it( 'should be able to add a file block', async () => {
		await editorPage.addNewBlock( blockNames.file );

		await editorPage.driver.sleep( 1000 );
		await editorPage.closePicker();

		const block = await editorPage.getFirstBlockVisible();
		await expect( block ).toBeTruthy();
	} );

	it( 'should add a file to the block', async () => {
		const block = await editorPage.getFirstBlockVisible();

		block.click();
		await editorPage.driver.sleep( 5000 );

		await editorPage.chooseMediaLibrary();

		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			testData.fileBlockPlaceholder.toLowerCase()
		);
	} );
} );
