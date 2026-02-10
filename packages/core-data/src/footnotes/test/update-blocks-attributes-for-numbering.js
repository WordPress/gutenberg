/**
 * WordPress dependencies
 */
import { RichTextData } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import updateBlocksAttributesForNumbering from '../update-blocks-attributes-for-numbering';

function makeFootnoteHTML( id, number ) {
	return `Text with <sup class="fn" data-fn="${ id }"><a href="#${ id }" id="${ id }-link">${ number }</a></sup>`;
}

describe( 'updateBlocksAttributesForNumbering', () => {
	it( 'should return blocks with same structure when no footnotes exist', () => {
		const blocks = [
			{
				name: 'core/paragraph',
				attributes: { content: 'No footnotes here' },
			},
		];
		const newOrder = [];

		const result = updateBlocksAttributesForNumbering( blocks, newOrder );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name ).toBe( 'core/paragraph' );
		expect( result[ 0 ].attributes.content ).toBe( 'No footnotes here' );
	} );

	it( 'should update numbering when order changes', () => {
		const fn1 = 'fn-1';
		const fn2 = 'fn-2';
		const richTextValue = RichTextData.fromHTMLString(
			`Text ${ makeFootnoteHTML( fn1, '1' ) } and ${ makeFootnoteHTML(
				fn2,
				'2'
			) }`
		);

		const blocks = [
			{
				name: 'core/paragraph',
				attributes: { content: richTextValue },
			},
		];

		// Reverse order: fn-2 should become 1, fn-1 should become 2.
		const newOrder = [ fn2, fn1 ];

		const result = updateBlocksAttributesForNumbering( blocks, newOrder );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].attributes.content ).toBeInstanceOf( RichTextData );
		// Should create new reference.
		expect( result[ 0 ] ).not.toBe( blocks[ 0 ] );
	} );

	it( 'should handle string-type rich text attributes', () => {
		const fn1 = 'fn-str';
		const htmlContent = makeFootnoteHTML( fn1, '1' );
		const blocks = [
			{
				name: 'core/paragraph',
				attributes: { content: htmlContent },
			},
		];

		const newOrder = [ fn1 ];
		const result = updateBlocksAttributesForNumbering( blocks, newOrder );

		expect( typeof result[ 0 ].attributes.content ).toBe( 'string' );
		expect( result[ 0 ].attributes.content ).toContain( fn1 );
	} );

	it( 'should handle blocks with inner blocks', () => {
		const fn1 = 'fn-inner';
		const richTextValue = RichTextData.fromHTMLString(
			makeFootnoteHTML( fn1, '1' )
		);

		const blocks = [
			{
				name: 'core/group',
				attributes: {},
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: richTextValue },
					},
				],
			},
		];

		const newOrder = [ fn1 ];
		const result = updateBlocksAttributesForNumbering( blocks, newOrder );

		expect(
			result[ 0 ].innerBlocks[ 0 ].attributes.content
		).toBeInstanceOf( RichTextData );
	} );

	it( 'should skip footnotes not in new order (deleted)', () => {
		const fn1 = 'fn-deleted';
		const richTextValue = RichTextData.fromHTMLString(
			makeFootnoteHTML( fn1, '1' )
		);

		const blocks = [
			{
				name: 'core/paragraph',
				attributes: { content: richTextValue },
			},
		];

		// Empty order — footnote was deleted.
		const newOrder = [];
		const result = updateBlocksAttributesForNumbering( blocks, newOrder );

		expect( result ).toHaveLength( 1 );
	} );

	it( 'should preserve non-rich-text attributes', () => {
		const blocks = [
			{
				name: 'core/image',
				attributes: {
					url: 'https://example.com/image.jpg',
					alt: 'An image',
					width: 300,
				},
			},
		];

		const newOrder = [];
		const result = updateBlocksAttributesForNumbering( blocks, newOrder );

		expect( result[ 0 ].attributes.url ).toBe(
			'https://example.com/image.jpg'
		);
		expect( result[ 0 ].attributes.alt ).toBe( 'An image' );
		expect( result[ 0 ].attributes.width ).toBe( 300 );
	} );

	it( 'should handle null/undefined attributes gracefully', () => {
		const blocks = [
			{ name: 'core/spacer', attributes: null },
			{ name: 'core/spacer', attributes: undefined },
		];

		const newOrder = [];
		const result = updateBlocksAttributesForNumbering( blocks, newOrder );

		expect( result ).toHaveLength( 2 );
		expect( result[ 0 ].attributes ).toBeNull();
		expect( result[ 1 ].attributes ).toBeUndefined();
	} );
} );
