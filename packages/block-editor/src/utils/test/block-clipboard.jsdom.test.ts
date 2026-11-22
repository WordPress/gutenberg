import { describe, expect, it } from 'vitest';
import {
	BLOCK_CLIPBOARD_WRAPPER,
	stripBlockClipboardWrapper,
} from '../block-clipboard';
import { getPasteEventData } from '../pasting';

describe( 'copied block wrapper marker', () => {
	it.each( [
		[ '', '', '' ],
		[ ' \n\t', '', '' ],
		[ `<meta charset='utf-8'>\n`, '', '' ],
		[ ` \n<meta charset='utf-8'>\n\t`, '', '' ],
		[
			'<html><body><!--StartFragment-->\n',
			'\n<!--EndFragment--></body></html>',
			'\n',
		],
	] )(
		'consumes only the leading marker after platform metadata (%s)',
		( prefix, suffix, trailingContent ) => {
			const content = `<!-- wp:paragraph --><p>Text ${ BLOCK_CLIPBOARD_WRAPPER }</p><!-- /wp:paragraph -->`;
			const event = {
				clipboardData: {
					getData: ( type: string ) =>
						type === 'text/html'
							? prefix +
								BLOCK_CLIPBOARD_WRAPPER +
								content +
								suffix
							: BLOCK_CLIPBOARD_WRAPPER + content,
					files: [],
					items: [],
				} as unknown as DataTransfer,
			};

			expect( getPasteEventData( event ) ).toEqual( {
				html: content + trailingContent,
				plainText: content,
				files: [],
			} );
			expect( stripBlockClipboardWrapper( content ) ).toBe( content );
		}
	);

	it( 'does not remove an identical comment inside copied content', () => {
		const content = `<p>Text ${ BLOCK_CLIPBOARD_WRAPPER }</p>`;
		expect( stripBlockClipboardWrapper( content ) ).toBe( content );
	} );
} );
