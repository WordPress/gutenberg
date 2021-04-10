/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';

const blockChildTestIds = {
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
	it( 'should be able to add a Search block', async () => {
		await editorPage.addNewBlock( blockNames.search );
		const searchBlock = await editorPage.getBlockAtPosition(
			blockNames.search
		);

		expect( searchBlock ).toBeTruthy();
	} );

	it( 'label should be visible and text set', async () => {
		// const block = await editorPage.getFirstBlockVisible();
		// block.click();

		const label = await editorPage.getSearchBlockChild(
			blockChildTestIds.label
		);
		const labelValue = await label.text();
		console.log( `AMANDA-TEST > label value: ${ labelValue }` );

		const input = await editorPage.getSearchBlockChild(
			blockChildTestIds.input
		);
		const inputValue = await input.text();
		console.log( `AMANDA-TEST > input value: ${ inputValue }` );

		const button = await editorPage.getSearchBlockChild(
			blockChildTestIds.button
		);
		const buttonValue = await button.text();
		console.log( `AMANDA-TEST > button value: ${ buttonValue }` );
	} );
} );
