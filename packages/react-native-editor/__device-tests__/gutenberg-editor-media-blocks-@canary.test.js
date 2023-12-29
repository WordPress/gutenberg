/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import { waitForMediaLibrary, isAndroid } from './helpers/utils';
import testData from './helpers/test-data';

const onlyOniOS = ! isAndroid() ? describe : describe.skip;

describe( 'Gutenberg Editor Audio Block tests', () => {
	it( 'should be able to add an audio block and a file to it', async () => {
		await editorPage.initializeEditor();
		// add an audio block
		await editorPage.addNewBlock( blockNames.audio );

		// dismiss the media picker automatically opened when adding an audio block
		await waitForMediaLibrary( editorPage.driver );
		await editorPage.closeMediaPicker();

		// verify there's an audio block
		const block = await editorPage.getFirstBlockVisible();
		expect( block ).toBeTruthy();

		// tap on the audio block
		await block.click();

		// wait for the media picker's Media Library option to come up
		await waitForMediaLibrary( editorPage.driver );

		// tap on Media Library option
		await editorPage.chooseMediaLibrary();
		// wait until the media is added
		await editorPage.driver.pause( 500 );

		// get the html version of the content
		const html = await editorPage.getHtmlContent();

		// verify the html matches the expected content
		expect( html.toLowerCase() ).toBe(
			testData.audioBlockPlaceholder.toLowerCase()
		);
	} );
} );

describe( 'Gutenberg Editor File Block tests', () => {
	it( 'should be able to add a file block and a file to it', async () => {
		await editorPage.initializeEditor();
		// add a file block
		await editorPage.addNewBlock( blockNames.file );

		// dismiss the media picker automatically opened when adding a file block
		await waitForMediaLibrary( editorPage.driver );
		await editorPage.closeMediaPicker();

		// verify there's a file block
		const block = await editorPage.getFirstBlockVisible();
		expect( block ).toBeTruthy();

		// tap on the file block
		await block.click();

		// wait for the media picker's Media Library option to come up
		await waitForMediaLibrary( editorPage.driver );

		// tap on Media Library option
		await editorPage.chooseMediaLibrary();
		// wait until the media is added
		await editorPage.driver.pause( 500 );

		// get the html version of the content
		const html = await editorPage.getHtmlContent();

		// verify the html matches the expected content
		expect( html.toLowerCase() ).toBe(
			testData.fileBlockPlaceholder.toLowerCase()
		);
	} );
} );

// iOS only test - It can only add images from the media library on iOS.
onlyOniOS( 'Gutenberg Editor Image Block tests', () => {
	it( 'should be able to add an image block', async () => {
		await editorPage.initializeEditor();
		await editorPage.addNewBlock( blockNames.image );
		await editorPage.closeMediaPicker();

		const imageBlock = await editorPage.getBlockAtPosition(
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
	} );
} );

onlyOniOS( 'Gutenberg Editor Cover Block test', () => {
	it( 'should displayed properly and have properly converted height (ios only)', async () => {
		// Temporarily this test is skipped on Android, due to the inconsistency of the results,
		// which are related to getting values in raw pixels instead of density pixels on Android.
		await editorPage.initializeEditor( {
			initialData: testData.coverHeightWithRemUnit,
		} );

		const coverBlock = await editorPage.getBlockAtPosition(
			blockNames.cover
		);

		const { height } = await coverBlock.getSize();
		// Height is set to 20rem, where 1rem is 16.
		// There is also block's vertical padding equal 16.
		// Finally, the total height should be 20 * 16 + 16 = 336.
		expect( height ).toBe( 336 );

		await coverBlock.click();
		expect( coverBlock ).toBeTruthy();
	} );

	// Testing this for iOS on a device is valuable to ensure that it properly
	// handles opening multiple modals, as only one can be open at a time.
	// NOTE: It can only add images from the media library on iOS.
	it( 'allows modifying media from within block settings', async () => {
		await editorPage.initializeEditor( {
			initialData: testData.coverHeightWithRemUnit,
		} );

		const coverBlock = await editorPage.getBlockAtPosition(
			blockNames.cover
		);
		await coverBlock.click();
		// Navigate upwards to select parent block
		await editorPage.moveBlockSelectionUp();

		await editorPage.openBlockSettings();
		await editorPage.clickAddMediaFromCoverBlock();
		await editorPage.chooseMediaLibrary();
		await editorPage.replaceMediaImage();

		// First modal should no longer be presented.
		const replaceButtons = await editorPage.driver.$$( '~Replace' );
		// eslint-disable-next-line jest/no-conditional-expect
		expect( replaceButtons.length ).toBe( 0 );

		// Select different media.
		await editorPage.chooseMediaLibrary();

		expect( coverBlock ).toBeTruthy();
	} );
} );
