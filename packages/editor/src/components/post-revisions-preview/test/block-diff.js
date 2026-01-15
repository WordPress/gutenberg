/**
 * WordPress dependencies
 */
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
	getBlockType,
	serialize,
} from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';
import * as paragraphBlock from '@wordpress/block-library/src/paragraph';
import * as groupBlock from '@wordpress/block-library/src/group';

/**
 * Internal dependencies
 */
import { diffRevisionContent } from '../block-diff';

/**
 * Convert blocks to a normalized format for comparison.
 * Converts RichTextData to HTML strings, similar to E2E test utils.
 * Always includes __revisionDiffStatus so we can verify its absence.
 *
 * @param {Array} blocks The blocks to normalize.
 * @return {Array} Normalized blocks with RichTextData converted to strings.
 */
function normalizeBlockTree( blocks ) {
	return blocks.map( ( block ) => {
		const attributes = Object.fromEntries(
			Object.entries( block.attributes ).map( ( [ key, value ] ) => {
				if ( value instanceof RichTextData ) {
					return [ key, value.toHTMLString() ];
				}
				return [ key, value ];
			} )
		);
		return {
			name: block.name,
			attributes: {
				...attributes,
				__revisionDiffStatus: block.attributes.__revisionDiffStatus,
			},
			innerBlocks: normalizeBlockTree( block.innerBlocks ),
		};
	} );
}

describe( 'diffRevisionContent', () => {
	beforeAll( () => {
		// Register actual core blocks for testing.
		if ( ! getBlockType( 'core/paragraph' ) ) {
			registerBlockType(
				{ name: paragraphBlock.name, ...paragraphBlock.metadata },
				paragraphBlock.settings
			);
		}
		if ( ! getBlockType( 'core/group' ) ) {
			registerBlockType(
				{ name: groupBlock.name, ...groupBlock.metadata },
				groupBlock.settings
			);
		}
	} );

	afterAll( () => {
		if ( getBlockType( 'core/paragraph' ) ) {
			unregisterBlockType( 'core/paragraph' );
		}
		if ( getBlockType( 'core/group' ) ) {
			unregisterBlockType( 'core/group' );
		}
	} );

	it( 'marks all blocks as added when no previous content', () => {
		const current = serialize( [
			createBlock( 'core/paragraph', { content: 'Hello' } ),
		] );
		const blocks = diffRevisionContent( current, '' );

		expect( normalizeBlockTree( blocks ) ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Hello',
					__revisionDiffStatus: 'added',
				},
			},
		] );
	} );

	it( 'marks all blocks as removed when no current content', () => {
		const previous = serialize( [
			createBlock( 'core/paragraph', { content: 'Hello' } ),
		] );
		const blocks = diffRevisionContent( '', previous );

		expect( normalizeBlockTree( blocks ) ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Hello',
					__revisionDiffStatus: 'removed',
				},
			},
		] );
	} );

	it( 'leaves unchanged blocks unmarked', () => {
		const content = serialize( [
			createBlock( 'core/paragraph', { content: 'Hello' } ),
		] );
		const blocks = diffRevisionContent( content, content );

		expect( normalizeBlockTree( blocks ) ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Hello',
					__revisionDiffStatus: undefined,
				},
			},
		] );
	} );

	it( 'detects changed paragraph content as modified', () => {
		const previous = serialize( [
			createBlock( 'core/paragraph', { content: 'Hello' } ),
		] );
		const current = serialize( [
			createBlock( 'core/paragraph', { content: 'World' } ),
		] );
		const blocks = diffRevisionContent( current, previous );

		expect( normalizeBlockTree( blocks ) ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					__revisionDiffStatus: 'modified',
				},
			},
		] );
	} );

	it( 'uses LCS so only changed blocks are marked', () => {
		const previous = serialize( [
			createBlock( 'core/paragraph', { content: 'A' } ),
			createBlock( 'core/paragraph', { content: 'B' } ),
		] );
		const current = serialize( [
			createBlock( 'core/paragraph', { content: 'NEW' } ),
			createBlock( 'core/paragraph', { content: 'A' } ),
			createBlock( 'core/paragraph', { content: 'B' } ),
		] );
		const blocks = diffRevisionContent( current, previous );

		expect( normalizeBlockTree( blocks ) ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'NEW',
					__revisionDiffStatus: 'added',
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: 'A',
					__revisionDiffStatus: undefined,
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: 'B',
					__revisionDiffStatus: undefined,
				},
			},
		] );
	} );

	it( 'handles inner block changes without marking parent', () => {
		const previous = serialize( [
			createBlock( 'core/group', {}, [
				createBlock( 'core/paragraph', { content: 'A' } ),
			] ),
		] );
		const current = serialize( [
			createBlock( 'core/group', {}, [
				createBlock( 'core/paragraph', { content: 'A' } ),
				createBlock( 'core/paragraph', { content: 'B' } ),
			] ),
		] );
		const blocks = diffRevisionContent( current, previous );

		expect( normalizeBlockTree( blocks ) ).toMatchObject( [
			{
				name: 'core/group',
				attributes: {
					__revisionDiffStatus: undefined,
				},
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'A',
							__revisionDiffStatus: undefined,
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							content: 'B',
							__revisionDiffStatus: 'added',
						},
					},
				],
			},
		] );
	} );

	it( 'handles removed inner blocks', () => {
		const previous = serialize( [
			createBlock( 'core/group', {}, [
				createBlock( 'core/paragraph', { content: 'A' } ),
				createBlock( 'core/paragraph', { content: 'B' } ),
			] ),
		] );
		const current = serialize( [
			createBlock( 'core/group', {}, [
				createBlock( 'core/paragraph', { content: 'A' } ),
			] ),
		] );
		const blocks = diffRevisionContent( current, previous );

		expect( normalizeBlockTree( blocks ) ).toMatchObject( [
			{
				name: 'core/group',
				attributes: {
					__revisionDiffStatus: undefined,
				},
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'A',
							__revisionDiffStatus: undefined,
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							content: 'B',
							__revisionDiffStatus: 'removed',
						},
					},
				],
			},
		] );
	} );

	it( 'returns empty array for empty content', () => {
		const blocks = diffRevisionContent( '', '' );
		expect( blocks ).toEqual( [] );
	} );

	describe( 'inner blocks', () => {
		it( 'handles deeply nested inner blocks', () => {
			const previous = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/group', {}, [
						createBlock( 'core/paragraph', { content: 'Deep' } ),
					] ),
				] ),
			] );
			const current = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/group', {}, [
						createBlock( 'core/paragraph', { content: 'Deep' } ),
						createBlock( 'core/paragraph', { content: 'New' } ),
					] ),
				] ),
			] );
			const blocks = diffRevisionContent( current, previous );

			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/group',
					attributes: {
						__revisionDiffStatus: undefined,
					},
					innerBlocks: [
						{
							name: 'core/group',
							attributes: {
								__revisionDiffStatus: undefined,
							},
							innerBlocks: [
								{
									name: 'core/paragraph',
									attributes: {
										content: 'Deep',
										__revisionDiffStatus: undefined,
									},
								},
								{
									name: 'core/paragraph',
									attributes: {
										content: 'New',
										__revisionDiffStatus: 'added',
									},
								},
							],
						},
					],
				},
			] );
		} );

		it( 'marks all inner blocks when container is added', () => {
			const previous = '';
			const current = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/paragraph', { content: 'A' } ),
					createBlock( 'core/paragraph', { content: 'B' } ),
				] ),
			] );
			const blocks = diffRevisionContent( current, previous );

			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/group',
					attributes: {
						__revisionDiffStatus: 'added',
					},
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: 'A',
								__revisionDiffStatus: 'added',
							},
						},
						{
							name: 'core/paragraph',
							attributes: {
								content: 'B',
								__revisionDiffStatus: 'added',
							},
						},
					],
				},
			] );
		} );

		it( 'marks all inner blocks when container is removed', () => {
			const previous = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/paragraph', { content: 'A' } ),
					createBlock( 'core/paragraph', { content: 'B' } ),
				] ),
			] );
			const current = '';
			const blocks = diffRevisionContent( current, previous );

			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/group',
					attributes: {
						__revisionDiffStatus: 'removed',
					},
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: 'A',
								__revisionDiffStatus: 'removed',
							},
						},
						{
							name: 'core/paragraph',
							attributes: {
								content: 'B',
								__revisionDiffStatus: 'removed',
							},
						},
					],
				},
			] );
		} );

		it( 'uses LCS for inner blocks so only changed ones are marked', () => {
			const previous = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/paragraph', { content: 'A' } ),
					createBlock( 'core/paragraph', { content: 'B' } ),
					createBlock( 'core/paragraph', { content: 'C' } ),
				] ),
			] );
			const current = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/paragraph', { content: 'NEW' } ),
					createBlock( 'core/paragraph', { content: 'A' } ),
					createBlock( 'core/paragraph', { content: 'B' } ),
					createBlock( 'core/paragraph', { content: 'C' } ),
				] ),
			] );
			const blocks = diffRevisionContent( current, previous );

			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/group',
					attributes: {
						__revisionDiffStatus: undefined,
					},
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: 'NEW',
								__revisionDiffStatus: 'added',
							},
						},
						{
							name: 'core/paragraph',
							attributes: {
								content: 'A',
								__revisionDiffStatus: undefined,
							},
						},
						{
							name: 'core/paragraph',
							attributes: {
								content: 'B',
								__revisionDiffStatus: undefined,
							},
						},
						{
							name: 'core/paragraph',
							attributes: {
								content: 'C',
								__revisionDiffStatus: undefined,
							},
						},
					],
				},
			] );
		} );

		it( 'handles changed inner block content as modified', () => {
			const previous = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/paragraph', { content: 'Original' } ),
				] ),
			] );
			const current = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/paragraph', { content: 'Modified' } ),
				] ),
			] );
			const blocks = diffRevisionContent( current, previous );

			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/group',
					attributes: {
						__revisionDiffStatus: undefined,
					},
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								__revisionDiffStatus: 'modified',
							},
						},
					],
				},
			] );
		} );

		it( 'handles multiple inner block changes at once', () => {
			const previous = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/paragraph', { content: 'A' } ),
					createBlock( 'core/paragraph', { content: 'B' } ),
					createBlock( 'core/paragraph', { content: 'C' } ),
				] ),
			] );
			const current = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/paragraph', { content: 'A' } ),
					createBlock( 'core/paragraph', { content: 'D' } ),
				] ),
			] );
			const blocks = diffRevisionContent( current, previous );

			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/group',
					attributes: {
						__revisionDiffStatus: undefined,
					},
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: 'A',
								__revisionDiffStatus: undefined,
							},
						},
						{
							name: 'core/paragraph',
							attributes: {
								content: 'B',
								__revisionDiffStatus: 'removed',
							},
						},
						{
							name: 'core/paragraph',
							attributes: {
								content: 'C',
								__revisionDiffStatus: 'removed',
							},
						},
						{
							name: 'core/paragraph',
							attributes: {
								content: 'D',
								__revisionDiffStatus: 'added',
							},
						},
					],
				},
			] );
		} );
	} );
} );
