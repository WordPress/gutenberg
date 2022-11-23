/**
 * Internal dependencies
 */
import testData from './helpers/test-data';

describe( 'Gutenberg Editor Unsupported Block Editor Tests', () => {
	beforeAll( async () => {
		// Needed to prevent issues with the WebView on Android
		await editorPage.setNetworkConnection();
	} );

	it( 'should be able to open the unsupported block web view editor', async () => {
		await editorPage.setHtmlContent( testData.unsupportedBlockHtml );

		const firstVisibleBlock = await editorPage.getFirstBlockVisible();
		await firstVisibleBlock.click();

		const helpButton = await editorPage.getUnsupportedBlockHelpButton();
		await helpButton.click();

		const editButton =
			await editorPage.getUnsupportedBlockBottomSheetEditButton();
		await editButton.click();

		const webViewSaveButton =
			await editorPage.getUnsupportedBlockWebViewSaveButton();
		await expect( webViewSaveButton ).toBeTruthy();
	} );
} );
