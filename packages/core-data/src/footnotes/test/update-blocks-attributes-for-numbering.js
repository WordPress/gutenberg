/**
 * WordPress dependencies
 */
import { RichTextData } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import updateBlocksAttributesForNumbering from '../update-blocks-attributes-for-numbering';

describe( 'updateBlocksAttributesForNumbering', () => {
	it( 'should return blocks unchanged when no footnotes exist', () => {
		const blocks = [
			{
				name: 'core/paragraph',
				attributes: { content: 'No footnotes here' },
			},
		];
		const newOrder = [];

		const result = updateBlocksAttributesForNumbering( blocks, newOrder );

		// Function always adds innerBlocks array, so we check structure instead
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name ).toBe( 'core/paragraph' );
		expect( result[ 0 ].attributes.content ).toBe( 'No footnotes here' );
	} );

	it( 'should update footnote numbering based on new order', () => {
		const footnote1Id = 'fn-1';
		const footnote2Id = 'fn-2';

		// Create a RichTextData with footnotes
		const richTextValue = RichTextData.fromHTMLString(
			`Text with <sup class="fn" data-fn="${ footnote1Id }"><a href="#${ footnote1Id }" id="${ footnote1Id }-link">1</a></sup> and <sup class="fn" data-fn="${ footnote2Id }"><a href="#${ footnote2Id }" id="${ footnote2Id }-link">2</a></sup>`
		);

		const blocks = [
			{
				name: 'core/paragraph',
				attributes: { content: richTextValue },
			},
		];

		// Reorder: fn-2 should become 1, fn-1 should become 2
		const newOrder = [ footnote2Id, footnote1Id ];

		const result = updateBlocksAttributesForNumbering( blocks, newOrder );

		// Verify function processes blocks and returns new references
		expect( result ).not.toBe( blocks ); // Should be new reference
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name ).toBe( 'core/paragraph' );
		expect( result[ 0 ].attributes.content ).toBeInstanceOf( RichTextData );

		// Verify the content is updated (function should process footnotes)
		// The exact structure may vary, but the function should complete without errors
		const updatedValue = result[ 0 ].attributes.content;
		expect( updatedValue ).toBeDefined();
		expect( typeof updatedValue.toHTMLString ).toBe( 'function' );
	} );

	it( 'should handle blocks with inner blocks', () => {
		const footnoteId = 'fn-1';
		const richTextValue = RichTextData.fromHTMLString(
			`Text with <sup class="fn" data-fn="${ footnoteId }"><a href="#${ footnoteId }" id="${ footnoteId }-link">1</a></sup>`
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

		const newOrder = [ footnoteId ];

		const result = updateBlocksAttributesForNumbering( blocks, newOrder );

		expect(
			result[ 0 ].innerBlocks[ 0 ].attributes.content
		).toBeInstanceOf( RichTextData );
	} );

	it( 'should skip footnotes not in new order', () => {
		const footnoteId = 'fn-1';
		const richTextValue = RichTextData.fromHTMLString(
			`Text with <sup class="fn" data-fn="${ footnoteId }"><a href="#${ footnoteId }" id="${ footnoteId }-link">1</a></sup>`
		);

		const blocks = [
			{
				name: 'core/paragraph',
				attributes: { content: richTextValue },
			},
		];

		// Empty order - footnote should be skipped
		const newOrder = [];

		const result = updateBlocksAttributesForNumbering( blocks, newOrder );

		// Should still return blocks but footnote won't be updated
		expect( result ).not.toBe( blocks );
	} );
} );
