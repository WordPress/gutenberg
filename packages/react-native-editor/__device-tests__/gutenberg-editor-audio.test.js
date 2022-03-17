/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { waitForMediaLibrary } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor Audio Block tests', () => {
	it( 'should be able to add an audio block', async () => {
		// add an audio block
		await editorPage.addNewBlock( blockNames.audio );

		// dismiss the media picker automatically opened when adding an audio block
		await waitForMediaLibrary( editorPage.driver );
		await editorPage.closePicker();

		// verify there's an audio block
		const block = await editorPage.getFirstBlockVisible();
		await expect( block ).toBeTruthy();

		// tap on the audio block
		block.click();

		// wait for the media picker's Media Library option to come up
		await waitForMediaLibrary( editorPage.driver );

		// tap on Media Library option
		await editorPage.chooseMediaLibrary();

		// get the html version of the content
		const html = await editorPage.getHtmlContent();

		// verify the html matches the expected content
		expect( html.toLowerCase() ).toBe(
			testData.audioBlockPlaceholder.toLowerCase()
		);
	} );
} );
