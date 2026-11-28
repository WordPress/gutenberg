import { describe, expect, it } from 'vitest';
import {
	BLOCK_CLIPBOARD_WRAPPER,
	addBlockClipboardWrapper,
	stripBlockClipboardWrapper,
} from '../block-clipboard';
import { getPasteEventData } from '../pasting';

describe( 'copied block wrapper marker', () => {
	it.each( [
		[ '', '', '' ],
		[ ' \n\t', '', '', ' \n\t' ],
		[ `<meta charset='utf-8'>\n`, '', '', '\n' ],
		[ ` \n<meta charset='utf-8'>\n\t`, '', '', '\n\t' ],
		[
			'<html><body><!--StartFragment-->\n',
			'\n<!--EndFragment--></body></html>',
			'\n',
			'\n',
		],
	] )(
		'consumes only the leading marker after platform metadata (%s)',
		( prefix, suffix, trailingContent, leadingContent = '' ) => {
			const content = `<!-- wp:paragraph --><p>Text ${ BLOCK_CLIPBOARD_WRAPPER }</p><!-- /wp:paragraph -->`;
			const event = {
				clipboardData: {
					getData: ( type: string ) =>
						type === 'text/html'
							? prefix +
								addBlockClipboardWrapper( content ) +
								suffix
							: addBlockClipboardWrapper( content ),
					files: [],
					items: [],
				} as unknown as DataTransfer,
			};

			expect( getPasteEventData( event ) ).toEqual( {
				html: leadingContent + content + trailingContent,
				plainText: content,
				files: [],
			} );
			expect( stripBlockClipboardWrapper( content ) ).toBe( content );
		}
	);

	it( 'does not remove identical marker text inside copied content', () => {
		const content = `<p>Text ${ BLOCK_CLIPBOARD_WRAPPER }</p>`;
		expect( stripBlockClipboardWrapper( content ) ).toBe( content );
	} );

	it.each( [
		'<!-- wp:group --><div></div><!-- /wp:group -->',
		'<!-- wp:group {} --><div></div><!-- /wp:group -->',
		'<!-- wp:list {"ordered":true} --><ol></ol><!-- /wp:list -->',
		' \n<!-- wp:group {"note":"\\u003c!--\\u002d\\u002d\\u003e"} --><div></div><!-- /wp:group -->',
	] )( 'preserves serialized attribute bytes: %s', ( content ) => {
		const marked = addBlockClipboardWrapper( content );
		expect( marked ).toContain( BLOCK_CLIPBOARD_WRAPPER );
		expect( stripBlockClipboardWrapper( marked ) ).toBe(
			content.replace( ' {} ', ' ' )
		);
	} );

	it( 'leaves nested markers and an unflagged outer block untouched', () => {
		const inner = addBlockClipboardWrapper(
			'<!-- wp:paragraph --><p>Text</p><!-- /wp:paragraph -->'
		);
		const content = `<!-- wp:group --><div>${ inner }</div><!-- /wp:group -->`;
		expect( stripBlockClipboardWrapper( content ) ).toBe( content );
		expect(
			stripBlockClipboardWrapper( addBlockClipboardWrapper( content ) )
		).toBe( content );
	} );

	it( 'leaves false markers untouched', () => {
		const content =
			'<!-- wp:list {"__wpClipboardWrapper":false} --><ul></ul><!-- /wp:list -->';
		expect( stripBlockClipboardWrapper( content ) ).toBe( content );
	} );
} );
