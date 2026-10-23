import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	getBlockTypes,
	parse,
	pasteHandler,
	rawHandler,
	serialize,
	unregisterBlockType,
	type Block,
} from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';
// @ts-expect-error `@wordpress/block-library` does not expose type declarations for its entry point.
import { registerCoreBlocks } from '@wordpress/block-library';

const rows = `<thead><tr><th colspan="2">Totals</th></tr></thead>
	<tbody><tr><td rowspan="2" style="text-align: center">January</td><td>$100</td></tr><tr><td>$200</td></tr></tbody>
	<tfoot><tr><td colspan="2">$300</td></tr></tfoot>`;
const caption = 'Monthly <em>savings</em> &amp; income';

function getCaption( block: Block ): RichTextData {
	const value = block.attributes.caption;
	expect( value ).toBeInstanceOf( RichTextData );
	return value as RichTextData;
}

describe( 'Table raw transforms', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	describe.each( [
		[ 'pasteHandler', pasteHandler ],
		[ 'rawHandler', rawHandler ],
	] as const )( '%s', ( handlerName, handler ) => {
		function convert( HTML: string ): Block[] {
			const options = { HTML, mode: 'BLOCKS' as const };
			const blocks = handler( options );
			if ( handlerName === 'pasteHandler' ) {
				expect( console ).toHaveLoggedWith(
					'Received HTML (pasteHandler):\n\n',
					HTML
				);
				expect( console ).toHaveLoggedWith(
					'Received plain text (pasteHandler):\n\n',
					''
				);
				expect( console ).toHaveLoggedWith(
					'Processed HTML piece:\n\n',
					expect.any( String )
				);
			}
			if ( ! Array.isArray( blocks ) ) {
				throw new Error( 'Expected converted blocks.' );
			}
			return blocks;
		}

		it.each( [
			[
				'native caption',
				`<table><caption>${ caption }</caption>${ rows }</table>`,
				caption,
			],
			[
				'figure caption after the table',
				`<figure class="wp-block-table"><table>${ rows }</table><figcaption>${ caption }</figcaption></figure>`,
				caption,
			],
			[
				'figure caption before the table',
				`<figure><figcaption>${ caption }</figcaption><table>${ rows }</table></figure>`,
				caption,
			],
			[ 'table without a caption', `<table>${ rows }</table>`, '' ],
		] )(
			'preserves a %s and its table data',
			( _label, HTML, expectedCaption ) => {
				const blocks = convert( HTML );
				expect( blocks ).toHaveLength( 1 );
				const [ block ] = blocks;
				expect( block.name ).toBe( 'core/table' );
				expect( getCaption( block ).toString() ).toBe(
					expectedCaption
				);
				expect( block.attributes ).toMatchObject( {
					head: [
						{
							cells: [
								{ content: 'Totals', tag: 'th', colspan: '2' },
							],
						},
					],
					body: [
						{
							cells: [
								{
									content: 'January',
									tag: 'td',
									rowspan: '2',
									align: 'center',
								},
								{ content: '$100', tag: 'td' },
							],
						},
						{ cells: [ { content: '$200', tag: 'td' } ] },
					],
					foot: [
						{
							cells: [
								{ content: '$300', tag: 'td', colspan: '2' },
							],
						},
					],
				} );

				const serialized = serialize( block );
				const document =
					window.document.implementation.createHTMLDocument( '' );
				document.body.innerHTML = serialized;
				expect(
					document.querySelectorAll( 'figure > table' )
				).toHaveLength( 1 );
				expect(
					document.querySelector( 'table > caption' )
				).toBeNull();
				expect(
					document.querySelector( 'figcaption' )?.innerHTML ?? ''
				).toBe( expectedCaption );
				const [ reparsed ] = parse( serialized );
				expect( reparsed.isValid ).toBe( true );
				expect( getCaption( reparsed ).toString() ).toBe(
					expectedCaption
				);
			}
		);

		it( 'preserves the text of a native caption containing a heading', () => {
			const blocks = convert(
				`<table><caption><h3>Monthly savings</h3></caption>${ rows }</table>`
			);
			expect( blocks ).toHaveLength( 1 );
			expect( getCaption( blocks[ 0 ] ).toPlainText() ).toBe(
				'Monthly savings'
			);
			const [ reparsed ] = parse( serialize( blocks ) );
			expect( reparsed.isValid ).toBe( true );
			expect( getCaption( reparsed ).toPlainText() ).toBe(
				'Monthly savings'
			);
		} );

		it( 'keeps surrounding paragraphs separate from a captioned table', () => {
			const blocks = convert(
				`<p>Before</p><table><caption>${ caption }</caption>${ rows }</table><p>After</p>`
			);
			expect( blocks.map( ( block ) => block.name ) ).toEqual( [
				'core/paragraph',
				'core/table',
				'core/paragraph',
			] );
			expect( String( blocks[ 0 ].attributes.content ) ).toBe( 'Before' );
			expect( getCaption( blocks[ 1 ] ).toString() ).toBe( caption );
			expect( String( blocks[ 2 ].attributes.content ) ).toBe( 'After' );
		} );

		it( 'keeps multiple tables in a figure without dropping their cells', () => {
			const blocks = convert(
				'<figure><table><tbody><tr><td>First</td></tr></tbody></table><table><tbody><tr><td>Second</td></tr></tbody></table></figure>'
			);
			const serialized = serialize( blocks );
			const doc = window.document.implementation.createHTMLDocument( '' );
			doc.body.innerHTML = serialized;
			expect(
				Array.from(
					doc.querySelectorAll( 'td' ),
					( cell ) => cell.textContent
				)
			).toEqual( [ 'First', 'Second' ] );
		} );

		it( 'keeps image figures as Image blocks with their own captions', () => {
			const blocks = convert(
				`<figure><img src="https://example.com/image.jpg"><figcaption>${ caption }</figcaption></figure>`
			);
			expect( blocks ).toHaveLength( 1 );
			expect( blocks[ 0 ].name ).toBe( 'core/image' );
			expect( getCaption( blocks[ 0 ] ).toString() ).toBe( caption );
		} );

		it( 'does not discard additional content in a figure containing a table', () => {
			const blocks = convert(
				'<figure><p>Keep this note</p><table><tbody><tr><td>January</td></tr></tbody></table></figure>'
			);
			const container = document.createElement( 'div' );
			container.innerHTML = serialize( blocks );
			expect( container ).toHaveTextContent( 'Keep this note' );
			expect( container.querySelector( 'td' )?.textContent ).toBe(
				'January'
			);
		} );
	} );

	it( 'preserves a raw table class without moving it to an extra wrapper', () => {
		const [ block ] = rawHandler( {
			HTML: '<table class="accounts"><tbody><tr><td>January</td></tr></tbody></table>',
		} );
		expect( block.name ).toBe( 'core/table' );
		expect( block.attributes.className ).toBe( 'accounts' );
	} );

	it( 'keeps raw figures with two different captions without discarding either', () => {
		const blocks = rawHandler( {
			HTML: '<figure><table><caption>Table title</caption><tbody><tr><td>January</td></tr></tbody></table><figcaption>Figure note</figcaption></figure>',
		} );
		const container = document.createElement( 'div' );
		container.innerHTML = serialize( blocks );
		expect( container ).toHaveTextContent( 'Table title' );
		expect( container ).toHaveTextContent( 'Figure note' );
		expect( container.querySelector( 'td' )?.textContent ).toBe(
			'January'
		);
	} );

	it.each( [
		'<table><caption>Nested caption</caption><tbody><tr><td>Nested cell</td></tr></tbody></table>',
		'<figure><img src="https://example.com/image.jpg"><figcaption>Nested caption</figcaption></figure>',
	] )(
		'does not use a caption inside a raw table cell as the table caption: %s',
		( content ) => {
			const [ block ] = rawHandler( {
				HTML: `<table><tbody><tr><td>${ content }</td></tr></tbody></table>`,
			} );
			expect( block.name ).toBe( 'core/table' );
			expect( getCaption( block ).toString() ).toBe( '' );
			expect( serialize( block ) ).toContain( 'Nested caption' );
		}
	);
} );
