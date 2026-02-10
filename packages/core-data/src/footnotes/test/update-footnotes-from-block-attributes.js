/**
 * Internal dependencies
 */
import updateFootnotesFromBlockAttributes from '../update-footnotes-from-block-attributes';

// Mock getFootnotesOrder to avoid the deep dependency chain through
// getRichTextValuesCached → block-editor private APIs. We use a simple
// `_footnoteIds` test property on blocks instead.
jest.mock( '../get-footnotes-order', () => ( {
	__esModule: true,
	default: ( blocks ) => {
		const order = [];
		( function extract( blockList ) {
			for ( const block of blockList ) {
				if ( block._footnoteIds ) {
					order.push( ...block._footnoteIds );
				}
				if ( block.innerBlocks ) {
					extract( block.innerBlocks );
				}
			}
		} )( blocks );
		return order;
	},
} ) );

// Mock updateBlocksWithFootnotes to avoid deep rich text processing.
// It returns blocks with the footnotes block updated to the new array.
jest.mock( '../update-blocks-with-footnotes', () => ( {
	__esModule: true,
	default: ( blocks, newFootnotes ) => {
		return blocks.map( ( block ) => {
			if ( block.name === 'core/footnotes' ) {
				return {
					...block,
					attributes: {
						...block.attributes,
						footnotes: newFootnotes,
					},
				};
			}
			return block;
		} );
	},
} ) );

function makeBlocks( footnoteIds ) {
	const paragraphs = footnoteIds.map( ( id ) => ( {
		name: 'core/paragraph',
		attributes: { content: `Text with ${ id }` },
		_footnoteIds: [ id ],
		innerBlocks: [],
	} ) );

	const footnotesBlock = {
		name: 'core/footnotes',
		attributes: {
			footnotes: footnoteIds.map( ( id ) => ( {
				id,
				content: `Footnote for ${ id }`,
			} ) ),
		},
		innerBlocks: [],
	};

	return [ ...paragraphs, footnotesBlock ];
}

describe( 'updateFootnotesFromBlockAttributes', () => {
	describe( 'short-circuit behavior', () => {
		it( 'should return same reference when no footnotes block exists', () => {
			const blocks = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello' },
					innerBlocks: [],
				},
			];

			const result = updateFootnotesFromBlockAttributes( blocks );

			expect( result.blocks ).toBe( blocks );
		} );

		it( 'should return same reference when footnotes block has no footnotes attribute', () => {
			const blocks = [
				{
					name: 'core/footnotes',
					attributes: {},
					innerBlocks: [],
				},
			];

			const result = updateFootnotesFromBlockAttributes( blocks );

			expect( result.blocks ).toBe( blocks );
		} );

		it( 'should return same reference when order has not changed', () => {
			const blocks = makeBlocks( [ 'fn-1', 'fn-2' ] );

			const result = updateFootnotesFromBlockAttributes( blocks );

			expect( result.blocks ).toBe( blocks );
		} );
	} );

	describe( 'reordering', () => {
		it( 'should reorder footnotes when block order changes', () => {
			const blocks = makeBlocks( [ 'fn-1', 'fn-2' ] );

			// Swap paragraphs: fn-2's paragraph first, then fn-1's.
			const reorderedBlocks = [
				blocks[ 1 ], // paragraph with fn-2
				blocks[ 0 ], // paragraph with fn-1
				blocks[ 2 ], // footnotes block (order still [fn-1, fn-2])
			];

			const result =
				updateFootnotesFromBlockAttributes( reorderedBlocks );

			expect( result.blocks ).not.toBe( reorderedBlocks );

			const footnotesBlock = result.blocks.find(
				( b ) => b.name === 'core/footnotes'
			);
			expect( footnotesBlock.attributes.footnotes[ 0 ].id ).toBe(
				'fn-2'
			);
			expect( footnotesBlock.attributes.footnotes[ 1 ].id ).toBe(
				'fn-1'
			);
		} );

		it( 'should create empty footnote for new IDs not in attributes', () => {
			// Blocks reference fn-1 and fn-new, but footnotes block only knows fn-1.
			const blocks = [
				{
					name: 'core/paragraph',
					attributes: { content: 'First' },
					_footnoteIds: [ 'fn-1' ],
					innerBlocks: [],
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Second' },
					_footnoteIds: [ 'fn-new' ],
					innerBlocks: [],
				},
				{
					name: 'core/footnotes',
					attributes: {
						footnotes: [
							{ id: 'fn-1', content: 'First footnote' },
						],
					},
					innerBlocks: [],
				},
			];

			const result = updateFootnotesFromBlockAttributes( blocks );

			const footnotesBlock = result.blocks.find(
				( b ) => b.name === 'core/footnotes'
			);
			expect( footnotesBlock.attributes.footnotes ).toHaveLength( 2 );
			expect( footnotesBlock.attributes.footnotes[ 1 ].id ).toBe(
				'fn-new'
			);
			expect( footnotesBlock.attributes.footnotes[ 1 ].content ).toBe(
				''
			);
		} );
	} );

	describe( 'footnote deletion', () => {
		it( 'should remove footnotes whose references were deleted', () => {
			const blocks = makeBlocks( [ 'fn-1', 'fn-2' ] );

			// Remove first paragraph (fn-1 gone).
			const afterDeletion = [
				blocks[ 1 ], // paragraph with fn-2
				blocks[ 2 ], // footnotes block (still has [fn-1, fn-2])
			];

			const result = updateFootnotesFromBlockAttributes( afterDeletion );

			const footnotesBlock = result.blocks.find(
				( b ) => b.name === 'core/footnotes'
			);
			expect( footnotesBlock.attributes.footnotes ).toHaveLength( 1 );
			expect( footnotesBlock.attributes.footnotes[ 0 ].id ).toBe(
				'fn-2'
			);
		} );

		it( 'should produce empty footnotes when all references deleted', () => {
			const blocks = makeBlocks( [ 'fn-1' ] );

			// Remove paragraph, keep only footnotes block.
			const afterDeletion = [
				blocks[ 1 ], // footnotes block
			];

			const result = updateFootnotesFromBlockAttributes( afterDeletion );

			const footnotesBlock = result.blocks.find(
				( b ) => b.name === 'core/footnotes'
			);
			expect( footnotesBlock.attributes.footnotes ).toHaveLength( 0 );
		} );
	} );

	describe( 'nested footnotes block', () => {
		it( 'should find footnotes block in inner blocks', () => {
			const blocks = [
				{
					name: 'core/paragraph',
					attributes: { content: 'Text' },
					_footnoteIds: [ 'fn-1' ],
					innerBlocks: [],
				},
				{
					name: 'core/group',
					attributes: {},
					innerBlocks: [
						{
							name: 'core/footnotes',
							attributes: {
								footnotes: [
									{ id: 'fn-1', content: 'Nested' },
								],
							},
							innerBlocks: [],
						},
					],
				},
			];

			const result = updateFootnotesFromBlockAttributes( blocks );

			// Order matches ([fn-1] === [fn-1]), so same reference.
			expect( result.blocks ).toBe( blocks );
		} );
	} );
} );
