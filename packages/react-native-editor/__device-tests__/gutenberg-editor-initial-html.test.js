/**
 * Internal dependencies
 */
import initialHtml from '../src/initial-html';
import { isAndroid } from './helpers/utils';
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor Blocks test', () => {
	it( 'should be able to create a post with all blocks and scroll to the last one', async () => {
		await editorPage.setHtmlContent( initialHtml );

		const lastBlockName = blockNames.paragraph;
		const lastBlockIndex = 30;
		const lastBlockAccessibilityLabel =
			'This block is used in initial HTML e2e tests and should be kept as the last block.';
		let lastBlockElement;
		if ( isAndroid() ) {
			lastBlockElement = await editorPage.androidScrollAndReturnElement(
				lastBlockAccessibilityLabel
			);
		} else {
			lastBlockElement = await editorPage.getBlockAtPosition(
				lastBlockName,
				lastBlockIndex
			);
		}

		expect( lastBlockElement ).toBeTruthy();
	} );
} );
