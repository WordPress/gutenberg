/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import testData from './helpers/test-data';

describe( 'Gutenberg Editor - Test Suite 4', () => {
	it( 'Spacer Block - Check if in DarkMode all components gets proper colors', async () => {
		await editorPage.setDeviceAppearance( 'dark' );
		await editorPage.addNewBlock( blockNames.spacer );

		const spacerBlock = await editorPage.getBlockAtPosition(
			blockNames.spacer
		);
		expect( spacerBlock ).toBeTruthy();
		await editorPage.openBlockSettings( spacerBlock );

		const screenshot = await editorPage.takeScreenshot();
		expect( screenshot ).toMatchImageSnapshot();

		await editorPage.dismissBottomSheet();
		await editorPage.removeBlockAtPosition( blockNames.spacer );
	} );

	it( 'Button Block - Check if in DarkMode all components gets proper colors', async () => {
		await editorPage.setDeviceAppearance( 'dark' );
		await editorPage.addNewBlock( blockNames.buttons );

		const buttonBlock = await editorPage.getBlockAtPosition(
			blockNames.button
		);
		expect( buttonBlock ).toBeTruthy();
		await editorPage.openBlockSettings( buttonBlock );

		const screenshot = await editorPage.takeScreenshot();
		expect( screenshot ).toMatchImageSnapshot();

		await editorPage.dismissBottomSheet();
		await editorPage.removeBlockAtPosition( blockNames.button );
	} );

	it( 'Group Block - Check if in DarkMode all components gets proper colors', async () => {
		await editorPage.setDeviceAppearance( 'dark' );
		await editorPage.addNewBlock( blockNames.group );

		const groupBlock = await editorPage.getBlockAtPosition(
			blockNames.group
		);
		expect( groupBlock ).toBeTruthy();

		// Insert a Paragraph block in Group block
		await editorPage.addBlockUsingAppender(
			groupBlock,
			blockNames.paragraph
		);
		const paragraphBlock = await editorPage.getBlockAtPosition(
			blockNames.paragraph
		);
		expect( paragraphBlock ).toBeTruthy();
		await editorPage.typeTextToTextBlock(
			paragraphBlock,
			testData.shortText
		);

		// Select Group block
		await editorPage.selectParentBlock();

		const screenshot = await editorPage.takeScreenshot();
		expect( screenshot ).toMatchImageSnapshot();

		await editorPage.dismissBottomSheet();
		await editorPage.removeBlockAtPosition( blockNames.group );
	} );
} );
