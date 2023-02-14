/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { waitForMediaLibrary, isAndroid } from './helpers/utils';
import testData from './helpers/test-data';

const onlyOniOS = ! isAndroid() ? describe : describe.skip;

describe( 'Gutenberg Editor Audio Block tests', () => {
	it( 'should be able to add an audio block and a file to it', async () => {
		// add an audio block
		await editorPage.addNewBlock( blockNames.audio );

		// dismiss the media picker automatically opened when adding an audio block
		await waitForMediaLibrary( editorPage.driver );
		await editorPage.closePicker();

		// verify there's an audio block
		let block = await editorPage.getFirstBlockVisible();
		await expect( block ).toBeTruthy();

		// tap on the audio block
		block.click();

		// wait for the media picker's Media Library option to come up
		await waitForMediaLibrary( editorPage.driver );

		// tap on Media Library option
		await editorPage.chooseMediaLibrary();

		// get the html version of the content
		const html = await editorPage.getHtmlContent();

		// verify the html matches the expected content
		expect( html.toLowerCase() ).toBe(
			testData.audioBlockPlaceholder.toLowerCase()
		);

		block = await editorPage.getBlockAtPosition( blockNames.audio );
		await block.click();
		await editorPage.removeBlock();
	} );
} );

describe( 'Gutenberg Editor File Block tests', () => {
	it( 'should be able to add a file block and a file to it', async () => {
		// add a file block
		await editorPage.addNewBlock( blockNames.file );

		// dismiss the media picker automatically opened when adding a file block
		await waitForMediaLibrary( editorPage.driver );
		await editorPage.closePicker();

		// verify there's a file block
		let block = await editorPage.getFirstBlockVisible();
		await expect( block ).toBeTruthy();

		// tap on the file block
		block.click();

		// wait for the media picker's Media Library option to come up
		await waitForMediaLibrary( editorPage.driver );

		// tap on Media Library option
		await editorPage.chooseMediaLibrary();

		// get the html version of the content
		const html = await editorPage.getHtmlContent();

		// verify the html matches the expected content
		expect( html.toLowerCase() ).toBe(
			testData.fileBlockPlaceholder.toLowerCase()
		);

		block = await editorPage.getBlockAtPosition( blockNames.file );
		await block.click();
		await editorPage.removeBlock();
	} );
} );

// iOS only test - It can only add images from the media library on iOS.
onlyOniOS( 'Gutenberg Editor Image Block tests', () => {
	it( 'should be able to add an image block', async () => {
		await editorPage.addNewBlock( blockNames.image );
		await editorPage.closePicker();

		let imageBlock = await editorPage.getBlockAtPosition(
			blockNames.image
		);

		await editorPage.selectEmptyImageBlock( imageBlock );
		await editorPage.chooseMediaLibrary();

		await editorPage.waitForElementToBeDisplayedById(
			'A snow-capped mountain top in a cloudy sky with red-leafed trees in the foreground',
			2000
		);
		await editorPage.enterCaptionToSelectedImageBlock(
			testData.imageCaption,
			true
		);

		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe(
			testData.imageShortHtml.toLowerCase()
		);

		imageBlock = await editorPage.getBlockAtPosition( blockNames.image );
		await imageBlock.click();
		await editorPage.removeBlock();
	} );
} );

onlyOniOS( 'Gutenberg Editor Cover Block test', () => {
	it( 'should displayed properly and have properly converted height (ios only)', async () => {
		// Temporarily this test is skipped on Android, due to the inconsistency of the results,
		// which are related to getting values in raw pixels instead of density pixels on Android.
		await editorPage.setHtmlContent( testData.coverHeightWithRemUnit );

		const coverBlock = await editorPage.getBlockAtPosition(
			blockNames.cover
		);

		const { height } = await coverBlock.getSize();
		// Height is set to 20rem, where 1rem is 16.
		// There is also block's vertical padding equal 32.
		// Finally, the total height should be 20 * 16 + 32 = 352.
		expect( height ).toBe( 352 );

		await coverBlock.click();
		expect( coverBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.cover );
	} );

	// Testing this for iOS on a device is valuable to ensure that it properly
	// handles opening multiple modals, as only one can be open at a time.
	// NOTE: It can only add images from the media library on iOS.
	it( 'allows modifying media from within block settings', async () => {
		await editorPage.setHtmlContent( testData.coverHeightWithRemUnit );

		const coverBlock = await editorPage.getBlockAtPosition(
			blockNames.cover
		);
		await coverBlock.click();

		await editorPage.openBlockSettings();
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
	} );
} );
