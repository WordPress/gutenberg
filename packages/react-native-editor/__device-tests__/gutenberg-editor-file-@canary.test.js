/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { waitForMediaLibrary } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor File Block tests', () => {
	it( 'should be able to add a file block and a file to it', async () => {
		// add a file block
		await editorPage.addNewBlock( blockNames.file );

		// dismiss the media picker automatically opened when adding a file block
		await waitForMediaLibrary( editorPage.driver );
		await editorPage.closePicker();

		// verify there's a file block
		const block = await editorPage.getFirstBlockVisible();
		await expect( block ).toBeTruthy();

		// tap on the file block
		block.click();

		// wait for the media picker's Media Library option to come up
		await waitForMediaLibrary( editorPage.driver );

		// tap on Media Library option
		await editorPage.chooseMediaLibrary();

		// get the html version of the content
		const html = await editorPage.getHtmlContent();

		// verify the html matches the expected content
		expect( html.toLowerCase() ).toBe(
			testData.fileBlockPlaceholder.toLowerCase()
		);
	} );
} );
