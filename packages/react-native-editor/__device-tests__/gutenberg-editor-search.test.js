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
	describe( 'Editing Search Block elements.', () => {
		it( 'Add search block via HTML', async () => {
			await editorPage.setHtmlContent( searchBlockHtml );
		} );

		it( 'Able to customize label text', async () => {
			await editorPage.sendTextToSearchBlockChild(
				testIds.label,
				testData.shortText
			);

			let actual;
			let expected;

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
				actual = await editorPage.getHtmlContent();
				expected = `"label":"${ testData.shortText }"`;
			}

			expect( actual ).toContain( expected );
		} );

		it( 'Able to customize placeholder text', async () => {
			await editorPage.sendTextToSearchBlockChild(
				testIds.input,
				testData.shortText
			);

			let actual;
			let expected;

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
				actual = await editorPage.getHtmlContent();
				expected = `"placeholder":"${ testData.shortText }"`;
			}

			expect( actual ).toContain( expected );
		} );

		it( 'Able to customize button text', async () => {
			await editorPage.sendTextToSearchBlockChild(
				testIds.button,
				testData.shortButtonText
			);

			let actual;
			let expected;

			if ( isAndroid() ) {
				// Android pads the string entered into the `PlainText` component so we'll get the
				// value a different way by asking for it directly.
				const input = await editorPage.getSearchBlockTextElement(
					testIds.button
				);
				const inputValue = await input.text();
				actual = inputValue.trim();
				expected = testData.shortButtonText;
			} else {
				actual = await editorPage.getHtmlContent();
				expected = `"buttonText":"${ testData.shortButtonText }"`;
			}

			expect( actual ).toContain( expected );
		} );

		it( 'Remove Search block', async () => {
			// Remove the search block to end this suite of tests.
			await editorPage.removeBlockAtPosition( blockNames.search );
		} );
	} );

	describe( 'Changing search block settings.', () => {
		it( 'Able to add the Search Block.', async () => {
			await editorPage.addNewBlock( blockNames.search );
			const searchBlock = await editorPage.getBlockAtPosition(
				blockNames.search
			);

			expect( searchBlock ).toBeTruthy();
		} );

		it( 'Able to hide search block label', async () => {
			const searchBlock = await editorPage.getBlockAtPosition(
				blockNames.search
			);

			await editorPage.toggleHideSearchLabelSetting( searchBlock );
			await editorPage.dismissBottomSheet();

			// switch to html and verify
			const html = await editorPage.getHtmlContent();
			expect( html ).toContain( `"showLabel":false` );
		} );

		it( 'Able to change to icon only button', async () => {
			const searchBlock = await editorPage.getBlockAtPosition(
				blockNames.search
			);

			await editorPage.toggleSearchIconOnlySetting( searchBlock );
			await editorPage.dismissBottomSheet();

			// switch to html and verify
			const html = await editorPage.getHtmlContent();
			expect( html ).toContain( `"buttonUseIcon":true` );
		} );

		it( 'Able to change button position to inside', async () => {
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

		it( 'Able change button position to no button', async () => {
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
		} );

		it( 'Remove search block', async () => {
			// Remove the search block to end this suite of tests.
			await editorPage.removeBlockAtPosition( blockNames.search );
		} );
	} );
} );
