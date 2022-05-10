/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { isAndroid } from './helpers/utils';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor Cover Block test', () => {
	it( 'should displayed properly and have properly converted height (ios only)', async () => {
		await editorPage.setHtmlContent( testData.coverHeightWithRemUnit );

		const coverBlock = await editorPage.getBlockAtPosition(
			blockNames.cover
		);

		// Temporarily this test is skipped on Android,due to the inconsistency of the results,
		// which are related to getting values in raw pixels instead of density pixels on Android.
		/* eslint-disable jest/no-conditional-expect */
		if ( ! isAndroid() ) {
			const { height } = await coverBlock.getSize();
			// Height is set to 20rem, where 1rem is 16.
			// There is also block's vertical padding equal 32.
			// Finally, the total height should be 20 * 16 + 32 = 352.
			expect( height ).toBe( 352 );
		}
		/* eslint-enable jest/no-conditional-expect */

		await coverBlock.click();
		expect( coverBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.cover );
	} );

	// Testing this for iOS on a device is valuable to ensure that it properly
	// handles opening multiple modals, as only one can be open at a time.
	it( 'allows modifying media from within block settings', async () => {
		await editorPage.setHtmlContent( testData.coverHeightWithRemUnit );

		const coverBlock = await editorPage.getBlockAtPosition(
			blockNames.cover
		);
		await coverBlock.click();

		// Can only add image from media library on iOS
		if ( ! isAndroid() ) {
			// Open block settings.
			const settingsButton = await editorPage.driver.elementByAccessibilityId(
				'Open Settings'
			);
			await settingsButton.click();

			// Add initial media via button within bottom sheet.
			const mediaSection = await editorPage.driver.elementByAccessibilityId(
				'Media Add image or video'
			);
			const addMediaButton = await mediaSection.elementByAccessibilityId(
				'Add image or video'
			);
			await addMediaButton.click();
			await editorPage.chooseMediaLibrary();

			// Edit media within block settings.
			await settingsButton.click();
			await editorPage.driver.sleep( 2000 ); // Await media load.
			const editImageButton = await editorPage.driver.elementsByAccessibilityId(
				'Edit image'
			);
			await editImageButton[ editImageButton.length - 1 ].click();

			// Replace image.
			const replaceButton = await editorPage.driver.elementByAccessibilityId(
				'Replace'
			);
			await replaceButton.click();

			// First modal should no longer be presented.
			const replaceButtons = await editorPage.driver.elementsByAccessibilityId(
				'Replace'
			);
			// eslint-disable-next-line jest/no-conditional-expect
			expect( replaceButtons.length ).toBe( 0 );

			// Select different media.
			await editorPage.chooseMediaLibrary();
		}

		expect( coverBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.cover );
	} );
} );
