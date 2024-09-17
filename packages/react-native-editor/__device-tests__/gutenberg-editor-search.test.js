/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import testData from './helpers/test-data';
import { isAndroid } from './helpers/utils';

const testIds = {
	label: 'search-block-label',
	input: 'search-block-input',
	button: 'search-block-button',
};

const searchBlockHtml = `<!-- wp:search {"label":"","buttonText":""} /-->`;

describe( 'Gutenberg Editor Search Block tests.', () => {
	it( 'Able to add the Search Block.', async () => {
		await editorPage.initializeEditor();
		await editorPage.addNewBlock( blockNames.search );
		const searchBlock = await editorPage.getBlockAtPosition(
			blockNames.search
		);
		expect( searchBlock ).toBeTruthy();
	} );

	describe( 'Editing Search Block elements.', () => {
		beforeEach( async () => {
			// Add a search block with all child elements having no text.
			// This is important to get around test flakiness where sometimes
			// the existing default text isn't replaced properly when entering
			// new text during testing.
			await editorPage.initializeEditor( {
				initialData: searchBlockHtml,
			} );

			// Tap search block to ensure selected.
			const searchBlock = await editorPage.getBlockAtPosition(
				blockNames.search
			);
			await searchBlock.click();
		} );

		it( 'Able to customize label text', async () => {
			await editorPage.sendTextToSearchBlockChild(
				testIds.label,
				testData.shortText
			);

			const expected = isAndroid()
				? testData.shortText
				: `"label":"${ testData.shortText }"`;
			await verifySearchElementText( testIds.label, expected );
		} );

		it( 'Able to customize placeholder text', async () => {
			await editorPage.sendTextToSearchBlockChild(
				testIds.input,
				testData.shortText
			);

			const expected = isAndroid()
				? testData.shortText
				: `"placeholder":"${ testData.shortText }"`;
			await verifySearchElementText( testIds.input, expected );
		} );

		it( 'Able to customize button text', async () => {
			await editorPage.sendTextToSearchBlockChild(
				testIds.button,
				testData.shortButtonText
			);

			const expected = isAndroid()
				? testData.shortButtonText
				: `"buttonText":"${ testData.shortButtonText }"`;
			await verifySearchElementText( testIds.button, expected );
		} );
	} );

	describe( 'Changing search block settings.', () => {
		beforeEach( async () => {
			await editorPage.initializeEditor( {
				initialData: searchBlockHtml,
			} );
		} );

		it( 'Able to hide search block label', async () => {
			const searchBlock = await editorPage.getBlockAtPosition(
				blockNames.search
			);
			await searchBlock.click();

			await editorPage.toggleHideSearchLabelSetting();
			await editorPage.dismissBottomSheet();

			// Switch to html and verify.
			const html = await editorPage.getHtmlContent();
			expect( html ).toContain( `"showLabel":false` );
		} );

		it( 'Able to change to icon only button', async () => {
			const searchBlock = await editorPage.getBlockAtPosition(
				blockNames.search
			);
			await searchBlock.click();

			await editorPage.toggleSearchIconOnlySetting();
			await editorPage.dismissBottomSheet();

			// Switch to html and verify.
			const html = await editorPage.getHtmlContent();
			expect( html ).toContain( `"buttonUseIcon":true` );
		} );

		it( 'Able to change button position to inside', async () => {
			const searchBlock = await editorPage.getBlockAtPosition(
				blockNames.search
			);
			await searchBlock.click();

			await editorPage.changeSearchButtonPositionSetting(
				'Button inside'
			);
			await editorPage.isSearchSettingsVisible();
			await editorPage.dismissBottomSheet();

			// Switch to html and verify.
			const html = await editorPage.getHtmlContent();
			expect( html ).toContain( `"buttonPosition":"button-inside"` );
		} );

		it( 'Able change button position to no button', async () => {
			const searchBlock = await editorPage.getBlockAtPosition(
				blockNames.search
			);
			await searchBlock.click();

			await editorPage.changeSearchButtonPositionSetting( 'No button' );
			await editorPage.isSearchSettingsVisible();
			await editorPage.dismissBottomSheet();

			// Switch to html and verify.
			const html = await editorPage.getHtmlContent();
			expect( html ).toContain( `"buttonPosition":"no-button"` );
		} );
	} );
} );

const verifySearchElementText = async ( testId, expected ) => {
	let actual;

	if ( isAndroid() ) {
		const input = await editorPage.getSearchBlockTextElement( testId );
		const inputValue = await input.getText();
		actual = inputValue.trim();
	} else {
		actual = await editorPage.getHtmlContent();
	}

	expect( actual ).toContain( expected );
};
