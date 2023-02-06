/**
 * Internal dependencies
 */
import testData from './helpers/test-data';
import { isAndroid } from './helpers/utils';

// Disabled for now on Android see https://github.com/wordpress-mobile/gutenberg-mobile/issues/5321
const onlyOniOS = ! isAndroid() ? describe : describe.skip;

onlyOniOS( 'Gutenberg Editor Unsupported Block Editor Tests', () => {
	it( 'should be able to open the unsupported block web view editor', async () => {
		await editorPage.setHtmlContent( testData.unsupportedBlockHtml );

		const firstVisibleBlock = await editorPage.getFirstBlockVisible();
		await firstVisibleBlock.click();

		const helpButton = await editorPage.getUnsupportedBlockHelpButton();
		await helpButton.click();

		const editButton =
			await editorPage.getUnsupportedBlockBottomSheetEditButton();
		await editButton.click();

		const webView = await editorPage.getUnsupportedBlockWebView();
		await expect( webView ).toBeTruthy();
	} );
} );
