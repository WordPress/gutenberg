/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor Search Block tests', () => {
	it( 'should be able to add a Search block', async () => {
		await editorPage.addNewBlock( blockNames.search );
		const searchBlock = await editorPage.getBlockAtPosition(
			blockNames.search
		);

		//TODO AMANDA -- testing
		const placeholderTV = await editorPage.getPlaceholderTextViewForSearchBlock();
		const placeholder = await placeholderTV.text();

		console.log( `AMANDA-TEST > placeholder value is: ${ placeholder }` );

		const labelTV = await editorPage.getLabelTextViewForSearchBlock(
			searchBlock
		);
		// const textEdit = labelTV.children[ 0 ];

		// const label = await textEdit.text();
		const label = await labelTV.text();
		console.log( `AMANDA-TEST > label value is: ${ label.toString() }` );

		// const buttonTV = await editorPage.getButtonTextViewForSearchBlock();
		// const button = await buttonTV.text();

		// console.log( `AMANDA-TEST > button value is: ${ button }` );

		expect( searchBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.search );
	} );
} );
