/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { waitForMediaLibrary } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor Audio Block tests', () => {
	it( 'should be able to add an audio block', async () => {
		await editorPage.addNewBlock( blockNames.audio );

		await waitForMediaLibrary( editorPage.driver );
		await editorPage.closePicker();

		const block = await editorPage.getFirstBlockVisible();
		await expect( block ).toBeTruthy();

		block.click();

		await waitForMediaLibrary( editorPage.driver );
		await editorPage.chooseMediaLibrary();

		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			testData.audioBlockPlaceholder.toLowerCase()
		);
	} );
} );
