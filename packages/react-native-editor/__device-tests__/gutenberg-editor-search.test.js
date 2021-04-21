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

describe( 'Gutenberg Editor Search Block tests', () => {
	it( 'should be able to add a Search block', async () => {
		await editorPage.addNewBlock( blockNames.search );
		const searchBlock = await editorPage.getBlockAtPosition(
			blockNames.search
		);

		expect( searchBlock ).toBeTruthy();
	} );

	describe( 'Editing Search Block elements', () => {
		it( 'able to customize label text', async () => {
			await editorPage.sendTextToSearchBlockChild(
				testIds.label,
				testData.shortText
			);

			let expected = '';
			let actual = '';
			if ( isAndroid() ) {
				// Android pads the string entered into the `PlainText` component so we'll get the
				// value a different way by asking for it directly.
				const input = await editorPage.getSearchBlockTextElement(
					testIds.label
				);
				const inputValue = await input.text();
				actual = inputValue.trim();
				expected = testData.shortText;
			} else {
				// Couldn't figure out how to get the value directly from the element on iOS so here we
				// switch to html and verify the results.
				actual = await editorPage.getHtmlContent();
				expected = `<!-- wp:search {"label":"${ testData.shortText }","buttonText":"Search"} /-->`;
			}

			expect( expected ).toBe( actual );
		} );

		it( 'able to customize placeholder text', async () => {
			await editorPage.sendTextToSearchBlockChild(
				testIds.input,
				testData.shortText
			);

			let expected = '';
			let actual = '';
			if ( isAndroid() ) {
				// Android pads the string entered into the `PlainText` component so we'll get the
				// value a different way by asking for it directly.
				const input = await editorPage.getSearchBlockTextElement(
					testIds.input
				);
				const inputValue = await input.text();
				actual = inputValue.trim();
				expected = testData.shortText;
			} else {
				// Couldn't figure out how to get the value directly from the element on iOS so here we
				// switch to html and verify the results.
				actual = await editorPage.getHtmlContent();
				expected = `<!-- wp:search {"label":"${ testData.shortText }","placeholder":"${ testData.shortText }","buttonText":"Search"} /-->`;
			}

			expect( expected ).toBe( actual );
		} );

		it( 'able to customize button text', async () => {
			// Changing text on the button doesn't work as expected on Android
			// so skip This test if running on Android.
			if ( isAndroid() ) {
				return;
			}

			await editorPage.sendTextToSearchBlockChild(
				testIds.button,
				testData.shortButtonText
			);

			// switch to html and verify html
			const html = await editorPage.getHtmlContent();

			expect( html ).toBe(
				`<!-- wp:search {"label":"${ testData.shortText }","placeholder":"${ testData.shortText }","buttonText":"${ testData.shortButtonText }"} /-->`
			);
		} );
	} );

	describe( 'Search block settings', () => {
		it( 'able to hide search block label', async () => {
			const searchBlock = await editorPage.getBlockAtPosition(
				blockNames.search
			);

			await editorPage.toggleHideSearchLabelSetting( searchBlock );
			await editorPage.dismissBottomSheet();

			// switch to html and verify
			const html = await editorPage.getHtmlContent();
			expect( html ).toContain( `"showLabel":false` );
		} );

		it( 'able to change to icon only button', async () => {
			const searchBlock = await editorPage.getBlockAtPosition(
				blockNames.search
			);

			await editorPage.toggleSearchIconOnlySetting( searchBlock );
			await editorPage.dismissBottomSheet();

			// switch to html and verify
			const html = await editorPage.getHtmlContent();
			expect( html ).toContain( `"buttonUseIcon":true` );
		} );

		it( 'able to change button position to inside', async () => {
			const searchBlock = await editorPage.getBlockAtPosition(
				blockNames.search
			);

			await editorPage.changeSearchButtonPositionSetting(
				searchBlock,
				'Button inside'
			);
			await editorPage.dismissBottomSheet();

			// switch to html and verify
			const html = await editorPage.getHtmlContent();
			expect( html ).toContain( `"buttonPosition":"button-inside"` );
		} );

		it( 'able change button position to no button', async () => {
			const searchBlock = await editorPage.getBlockAtPosition(
				blockNames.search
			);

			await editorPage.changeSearchButtonPositionSetting(
				searchBlock,
				'No button'
			);
			await editorPage.dismissBottomSheet();

			// switch to html and verify
			const html = await editorPage.getHtmlContent();
			expect( html ).toContain( `"buttonPosition":"no-button"` );

			// Remove the search block to end this suite of tests.
			await editorPage.removeBlockAtPosition( blockNames.search );
		} );
	} );
} );
