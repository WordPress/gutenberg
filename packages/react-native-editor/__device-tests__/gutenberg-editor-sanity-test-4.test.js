/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor - Test Suite 4', () => {
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

		await editorPage.dismissBottomSheet();
		await editorPage.removeBlockAtPosition( blockNames.spacer );
	} );

	it.only( 'Button Block - Check if in DarkMode all components gets proper colors', async () => {
		await editorPage.setDeviceAppearance( 'dark' );
		await editorPage.addNewBlock( blockNames.buttons );

		const buttonBlock = await editorPage.getBlockAtPosition(
			blockNames.button
		);
		expect( buttonBlock ).toBeTruthy();
		await editorPage.openBlockSettings( buttonBlock );

		// Wait for block settings to be opened
		await editorPage.driver.sleep( 500 );

		const screenshot = await editorPage.takeScreenshot();
		expect( screenshot ).toMatchImageSnapshot();

		await editorPage.dismissBottomSheet();
		await editorPage.removeBlockAtPosition( blockNames.button );
	} );
} );
