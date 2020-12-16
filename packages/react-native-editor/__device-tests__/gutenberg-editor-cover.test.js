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
		if ( ! isAndroid() ) {
			const { height } = await coverBlock.getSize();
			// Height is set to 20rem, where 1rem is 16.
			// There is also block's vertical padding equal 32.
			// Finally, the total height should be 20 * 16 + 32 = 352
			expect( height ).toBe( 352 );
		}

		await coverBlock.click();
		expect( coverBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.cover );
	} );
} );
