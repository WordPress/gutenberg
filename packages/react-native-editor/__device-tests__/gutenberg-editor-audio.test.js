/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import testData from './helpers/test-data';
import { isAndroid } from './helpers/utils';

describe( 'Gutenberg Editor Audio Block tests', () => {
	it( 'should be able to add an audio block', async () => {
		await editorPage.addNewBlock( blockNames.audio );

		await editorPage.driver.sleep( 1000 );
		await editorPage.closePicker();

		const block = await editorPage.getFirstBlockVisible();
		await expect( block ).toBeTruthy();
	} );

	it( 'should add an audio file to the block', async () => {
		const block = await editorPage.getFirstBlockVisible();

		block.click();

		if ( isAndroid() ) {
			await editorPage.driver.sleep( 5000 );
		} else {
			await editorPage.driver.sleep( 1000 );
		}

		await editorPage.chooseMediaLibrary();

		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			testData.audioBlockPlaceholder.toLowerCase()
		);
	} );
} );
