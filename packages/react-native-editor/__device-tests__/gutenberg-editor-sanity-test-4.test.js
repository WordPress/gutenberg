/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
// import testData from './helpers/test-data';

describe( 'Gutenberg Editor Visual test - Sanity Test 4', () => {
	it( 'Spacer Block - Check if in DarkMode all components gets proper colors', async () => {
		await editorPage.setDeviceAppearance( 'dark' );
		await editorPage.addNewBlock( blockNames.spacer );

		const spacerBlock = await editorPage.getBlockAtPosition(
			blockNames.spacer
		);
		expect( spacerBlock ).toBeTruthy();
		await editorPage.openBlockSettings( spacerBlock );

		// Wait for block settings to be opened
		await editorPage.driver.sleep( 500 );

		const screenshot = await editorPage.takeScreenshot();
		expect( screenshot ).toMatchImageSnapshot();
	} );
} );
