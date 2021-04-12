/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import testData from './helpers/test-data';
import { isAndroid } from './helpers/utils';

const testKeys = {
	label: {
		android: 'Search block label.',
		ios: 'search-block-label',
	},
	input: {
		android: 'Search input field.',
		ios: 'search-block-input',
	},
	button: {
		android: 'Search button.',
		ios: 'search-block-button',
	},
};

describe( 'Gutenberg Editor Search Block tests', () => {
	describe( 'Should be able to edit child elements of Search Block', () => {
		it( 'should be able to add a Search block', async () => {
			await editorPage.addNewBlock( blockNames.search );
			const searchBlock = await editorPage.getBlockAtPosition(
				blockNames.search
			);

			expect( searchBlock ).toBeTruthy();
		} );

		it( 'able to customize label text', async () => {
			await editorPage.sendTextToSearchBlockChild(
				testKeys.label,
				testData.shortText
			);

			let expected = '';
			let actual = '';
			if ( isAndroid() ) {
				// Android pads the string entered into the `PlainText` component so we'll get the
				// value a different way by asking for it directly.
				const input = await editorPage.getSearchBlockChild(
					testKeys.label
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
				testKeys.input,
				testData.shortText,
				false
			);

			let expected = '';
			let actual = '';
			if ( isAndroid() ) {
				// Android pads the string entered into the `PlainText` component so we'll get the
				// value a different way by asking for it directly.
				const input = await editorPage.getSearchBlockChild(
					testKeys.input
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
				// Remove the search block to end this suite of tests.
				await editorPage.removeBlockAtPosition( blockNames.search );
				return;
			}

			await editorPage.sendTextToSearchBlockChild(
				testKeys.button,
				testData.shortButtonText
			);

			// switch to html and verify html
			const html = await editorPage.getHtmlContent();

			expect( html ).toBe(
				`<!-- wp:search {"label":"${ testData.shortText }","placeholder":"${ testData.shortText }","buttonText":"${ testData.shortButtonText }"} /-->`
			);

			// Remove the search block to end this suite of tests.
			await editorPage.removeBlockAtPosition( blockNames.search );
		} );
	} );
} );
