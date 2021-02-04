/**
 * Internal dependencies
 */
import initialHtml from '../src/initial-html';
import { isAndroid } from './helpers/utils';

describe( 'Gutenberg Editor Blocks test', () => {
	it( 'should be able to create a post with all blocks and scroll to the last one', async () => {
		await editorPage.setHtmlContent( initialHtml );

		const lastBlockAccessibilityLabel =
			'This block is used in initial HTML e2e tests and should be kept as the last block.';
		let lastBlockElement;
		if ( isAndroid() ) {
			lastBlockElement = await editorPage.androidScrollAndReturnElement(
				lastBlockAccessibilityLabel
			);
		} else {
			lastBlockElement = await editorPage.getLastElementByXPath(
				lastBlockAccessibilityLabel
			);
		}

		expect( lastBlockElement ).toBeTruthy();
	} );
} );
