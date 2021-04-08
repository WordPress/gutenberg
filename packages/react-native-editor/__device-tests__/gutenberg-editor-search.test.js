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

		console.log( 'AMANDA-TEST' );

		//TODO AMANDA -- testing
		const placeholderTV = await editorPage.getPlaceholderTextViewForSearchBlock();
		const placeholder = await placeholderTV.text();

		console.log( `AMANDA-TEST > placeholder value is ${ placeholder }` );

		expect( searchBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( blockNames.search );
	} );
} );
