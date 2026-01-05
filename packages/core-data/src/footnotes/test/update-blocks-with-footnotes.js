/**
 * Internal dependencies
 */
import updateBlocksWithFootnotes from '../update-blocks-with-footnotes';

describe( 'updateBlocksWithFootnotes', () => {
	it( 'should update footnotes block with new footnotes array', () => {
		const blocks = [
			{
				name: 'core/footnotes',
				attributes: {
					footnotes: [ { id: 'fn-1', content: 'Old' } ],
				},
			},
		];

		const newFootnotes = [
			{ id: 'fn-1', content: 'Updated' },
			{ id: 'fn-2', content: 'New' },
		];
		const newOrder = [ 'fn-1', 'fn-2' ];

		const result = updateBlocksWithFootnotes(
			blocks,
			newFootnotes,
			newOrder
		);

		expect( result[ 0 ].attributes.footnotes ).toEqual( newFootnotes );
		expect( result[ 0 ].attributes.__footnotesVersion ).toBe( 1 );
	} );

	it( 'should increment version number on each update', () => {
		const blocks = [
			{
				name: 'core/footnotes',
				attributes: {
					footnotes: [ { id: 'fn-1', content: 'Test' } ],
					__footnotesVersion: 2,
				},
			},
		];

		const newFootnotes = [ { id: 'fn-1', content: 'Updated' } ];
		const newOrder = [ 'fn-1' ];

		const result = updateBlocksWithFootnotes(
			blocks,
			newFootnotes,
			newOrder
		);

		expect( result[ 0 ].attributes.__footnotesVersion ).toBe( 3 );
	} );

	it( 'should update numbering in other blocks', () => {
		const footnoteId = 'fn-1';
		const blocks = [
			{
				name: 'core/paragraph',
				attributes: {
					content: `Text with footnote <sup class="fn" data-fn="${ footnoteId }"><a href="#${ footnoteId }" id="${ footnoteId }-link">1</a></sup>`,
				},
			},
			{
				name: 'core/footnotes',
				attributes: {
					footnotes: [ { id: footnoteId, content: 'Test' } ],
				},
			},
		];

		const newFootnotes = [ { id: footnoteId, content: 'Updated' } ];
		const newOrder = [ footnoteId ];

		const result = updateBlocksWithFootnotes(
			blocks,
			newFootnotes,
			newOrder
		);

		// Should update both the paragraph and footnotes block
		expect( result.length ).toBe( 2 );
		expect( result[ 1 ].attributes.footnotes ).toEqual( newFootnotes );
	} );

	it( 'should handle blocks without footnotes block', () => {
		const blocks = [
			{
				name: 'core/paragraph',
				attributes: { content: 'No footnotes' },
			},
		];

		const newFootnotes = [];
		const newOrder = [];

		const result = updateBlocksWithFootnotes(
			blocks,
			newFootnotes,
			newOrder
		);

		expect( result ).not.toBe( blocks );
		expect( result.length ).toBe( 1 );
	} );
} );
