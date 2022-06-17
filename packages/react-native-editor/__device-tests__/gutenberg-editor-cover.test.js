/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor Cover Block test', () => {
	it( 'should displayed properly and have properly converted height (ios only)', async () => {
		// Temporarily this test is skipped on Android,due to the inconsistency of the results,
		// which are related to getting values in raw pixels instead of density pixels on Android.
		/* eslint-disable jest/no-conditional-expect */
		if ( ! isAndroid() ) {
			await editorPage.setHtmlContent( testData.coverHeightWithRemUnit );

			const coverBlock = await editorPage.getBlockAtPosition(
				blockNames.cover
			);

			const { height } = await coverBlock.getSize();
			// Height is set to 20rem, where 1rem is 16.
			// There is also block's vertical padding equal 32.
			// Finally, the total height should be 20 * 16 + 32 = 352.
			expect( height ).toBe( 352 );
			/* eslint-enable jest/no-conditional-expect */

			await coverBlock.click();
			expect( coverBlock ).toBeTruthy();
			await editorPage.removeBlockAtPosition( blockNames.cover );
		}
	} );

	// Testing this for iOS on a device is valuable to ensure that it properly
	// handles opening multiple modals, as only one can be open at a time.
	it( 'allows modifying media from within block settings', async () => {
		// Can only add image from media library on iOS
		if ( ! isAndroid() ) {
			await editorPage.setHtmlContent( testData.coverHeightWithRemUnit );

			const coverBlock = await editorPage.getBlockAtPosition(
				blockNames.cover
			);

			await editorPage.openBlockSettings( coverBlock );
			await editorPage.clickAddMediaFromCoverBlock();
			await editorPage.chooseMediaLibrary();
			await editorPage.replaceMediaImage();

			// First modal should no longer be presented.
			const replaceButtons =
				await editorPage.driver.elementsByAccessibilityId( 'Replace' );
			// eslint-disable-next-line jest/no-conditional-expect
			expect( replaceButtons.length ).toBe( 0 );

			// Select different media.
			await editorPage.chooseMediaLibrary();

			expect( coverBlock ).toBeTruthy();
			await editorPage.removeBlockAtPosition( blockNames.cover );
		}
	} );
} );
