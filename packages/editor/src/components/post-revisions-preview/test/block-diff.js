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
import {
	registerDiffFormatTypes,
	unregisterDiffFormatTypes,
} from '../diff-format-types';

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
				__revisionDiffStatus: block.__revisionDiffStatus,
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

		registerDiffFormatTypes();
	} );

	afterAll( () => {
		if ( getBlockType( 'core/paragraph' ) ) {
			unregisterBlockType( 'core/paragraph' );
		}
		if ( getBlockType( 'core/group' ) ) {
			unregisterBlockType( 'core/group' );
		}

		unregisterDiffFormatTypes();
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

	it( 'handles two blocks added above a slightly modified paragraph', () => {
		const previous = serialize( [
			createBlock( 'core/paragraph', {
				content: 'This is some existing content',
			} ),
		] );
		const current = serialize( [
			createBlock( 'core/paragraph', { content: 'First new block' } ),
			createBlock( 'core/paragraph', { content: 'Second new block' } ),
			createBlock( 'core/paragraph', {
				content: 'This is some modified content',
			} ),
		] );
		const blocks = diffRevisionContent( current, previous );
		const normalized = normalizeBlockTree( blocks );

		// Post-LCS pairing detects similar blocks and marks them as modified.
		// The removed block is filtered out, modified block shows inline diff.
		expect( normalized ).toHaveLength( 3 );
		expect( normalized ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'First new block',
					__revisionDiffStatus: 'added',
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Second new block',
					__revisionDiffStatus: 'added',
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					// Inline diff: "existing" → "modified"
					content:
						'This is some <del title="Removed" class="revision-diff-removed">existing</del><ins title="Added" class="revision-diff-added">modified</ins> content',
					__revisionDiffStatus: 'modified',
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

	it( 'handles two blocks that swapped positions', () => {
		const previous = serialize( [
			createBlock( 'core/paragraph', { content: 'First block content' } ),
			createBlock( 'core/paragraph', {
				content: 'Second block content',
			} ),
		] );
		const current = serialize( [
			createBlock( 'core/paragraph', {
				content: 'Second block content',
			} ),
			createBlock( 'core/paragraph', { content: 'First block content' } ),
		] );
		const blocks = diffRevisionContent( current, previous );

		// LCS matches one block ("First block content" at prev[0] -> curr[1]).
		// The other block appears as removed + added (showing the reorder).
		// We intentionally don't pair identical blocks as "modified" since
		// there's no actual content change - just a position change.
		expect( normalizeBlockTree( blocks ) ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Second block content',
					__revisionDiffStatus: 'added',
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: 'First block content',
					__revisionDiffStatus: undefined,
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Second block content',
					__revisionDiffStatus: 'removed',
				},
			},
		] );
	} );

	it( 'pairs blocks as modified when attrs differ but content is identical', () => {
		const previous = serialize( [
			createBlock( 'core/paragraph', { content: 'Same content' } ),
		] );
		const current = serialize( [
			createBlock( 'core/paragraph', {
				content: 'Same content',
				className: 'new-class',
			} ),
		] );
		const blocks = diffRevisionContent( current, previous );

		// Content is identical but attrs changed - should be marked as modified.
		expect( normalizeBlockTree( blocks ) ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Same content',
					className: 'new-class',
					__revisionDiffStatus: 'modified',
				},
			},
		] );
	} );

	it( 'handles block move with a tiny change', () => {
		const previous = serialize( [
			createBlock( 'core/paragraph', { content: 'First block content' } ),
			createBlock( 'core/paragraph', {
				content: 'Second block content',
			} ),
		] );
		const current = serialize( [
			createBlock( 'core/paragraph', {
				content: 'Second block content modified',
			} ),
			createBlock( 'core/paragraph', { content: 'First block content' } ),
		] );
		const blocks = diffRevisionContent( current, previous );

		// The moved+modified block is correctly paired and shows inline diff.
		// The unchanged block remains unmarked.
		expect( normalizeBlockTree( blocks ) ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'Second block content<ins title="Added" class="revision-diff-added"> modified</ins>',
					__revisionDiffStatus: 'modified',
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: 'First block content',
					__revisionDiffStatus: undefined,
				},
			},
		] );
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

		it( 'does not mark inner blocks when container is added (parent styling is sufficient)', () => {
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
					],
				},
			] );
		} );

		it( 'does not mark inner blocks when container is removed (parent styling is sufficient)', () => {
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

			// Post-LCS pairing matches B with D (same block type, high HTML similarity).
			// C remains removed since it has no matching added block.
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
								content: 'C',
								__revisionDiffStatus: 'removed',
							},
						},
						{
							name: 'core/paragraph',
							attributes: {
								// B→D modification with inline diff
								content:
									'<del title="Removed" class="revision-diff-removed">B</del><ins title="Added" class="revision-diff-added">D</ins>',
								__revisionDiffStatus: 'modified',
							},
						},
					],
				},
			] );
		} );

		it( 'does not pair blocks with completely different content', () => {
			const previous = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/paragraph', {
						content: 'First paragraph stays the same',
					} ),
					createBlock( 'core/paragraph', {
						content:
							'The quick brown fox jumps over the lazy dog near the riverbank',
					} ),
					createBlock( 'core/paragraph', {
						content: 'Third paragraph also removed from this post',
					} ),
				] ),
			] );
			const current = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/paragraph', {
						content: 'First paragraph stays the same',
					} ),
					createBlock( 'core/paragraph', {
						content:
							'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod',
					} ),
				] ),
			] );
			const blocks = diffRevisionContent( current, previous );

			// With word-based similarity, completely different sentences are NOT paired.
			// They appear as separate removed + added blocks.
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
								content: 'First paragraph stays the same',
								__revisionDiffStatus: undefined,
							},
						},
						{
							name: 'core/paragraph',
							attributes: {
								content:
									'The quick brown fox jumps over the lazy dog near the riverbank',
								__revisionDiffStatus: 'removed',
							},
						},
						{
							name: 'core/paragraph',
							attributes: {
								content:
									'Third paragraph also removed from this post',
								__revisionDiffStatus: 'removed',
							},
						},
						{
							name: 'core/paragraph',
							attributes: {
								content:
									'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod',
								__revisionDiffStatus: 'added',
							},
						},
					],
				},
			] );
		} );
	} );

	describe( 'rich text formatting', () => {
		it( 'detects unchanged paragraph with bold formatting', () => {
			const content = serialize( [
				createBlock( 'core/paragraph', {
					content: 'Hello <strong>world</strong>',
				} ),
			] );
			const blocks = diffRevisionContent( content, content );

			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Hello <strong>world</strong>',
						__revisionDiffStatus: undefined,
					},
				},
			] );
		} );

		it( 'detects added bold formatting as modification', () => {
			const previous = serialize( [
				createBlock( 'core/paragraph', { content: 'Hello world' } ),
			] );
			const current = serialize( [
				createBlock( 'core/paragraph', {
					content: 'Hello <strong>world</strong>',
				} ),
			] );
			const blocks = diffRevisionContent( current, previous );

			// Format-only change: only "world" is marked (where bold was added).
			// "Hello " is not marked since its formatting didn't change.
			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content:
							'Hello <strong><span title="1 format added" class="revision-diff-format-added">world</span></strong>',
						__revisionDiffStatus: 'modified',
					},
				},
			] );
		} );

		it( 'detects changed text within bold formatting as modification', () => {
			const previous = serialize( [
				createBlock( 'core/paragraph', {
					content: 'Hello <strong>world</strong>',
				} ),
			] );
			const current = serialize( [
				createBlock( 'core/paragraph', {
					content: 'Hello <strong>everyone</strong>',
				} ),
			] );
			const blocks = diffRevisionContent( current, previous );

			// Word-level diff: "world" changed to "everyone" within bold formatting.
			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content:
							'Hello <strong><del title="Removed" class="revision-diff-removed">world</del><ins title="Added" class="revision-diff-added">everyone</ins></strong>',
						__revisionDiffStatus: 'modified',
					},
				},
			] );
		} );

		it( 'detects unchanged paragraph with link', () => {
			const content = serialize( [
				createBlock( 'core/paragraph', {
					content:
						'Visit <a href="https://example.com">our site</a> today',
				} ),
			] );
			const blocks = diffRevisionContent( content, content );

			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content:
							'Visit <a href="https://example.com">our site</a> today',
						__revisionDiffStatus: undefined,
					},
				},
			] );
		} );

		it( 'detects changed link URL as modification', () => {
			const previous = serialize( [
				createBlock( 'core/paragraph', {
					content:
						'Visit <a href="https://old-site.com">our site</a> today',
				} ),
			] );
			const current = serialize( [
				createBlock( 'core/paragraph', {
					content:
						'Visit <a href="https://new-site.com">our site</a> today',
				} ),
			] );
			const blocks = diffRevisionContent( current, previous );

			// Format-only change: only the link text is marked (where URL changed).
			// "Visit " and " today" are not marked.
			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content:
							'Visit <a href="https://new-site.com"><span title="1 format changed" class="revision-diff-format-changed">our site</span></a> today',
						__revisionDiffStatus: 'modified',
					},
				},
			] );
		} );

		it( 'detects changed link text as modification', () => {
			const previous = serialize( [
				createBlock( 'core/paragraph', {
					content:
						'Visit <a href="https://example.com">our site</a> today',
				} ),
			] );
			const current = serialize( [
				createBlock( 'core/paragraph', {
					content:
						'Visit <a href="https://example.com">the website</a> today',
				} ),
			] );
			const blocks = diffRevisionContent( current, previous );

			// Word-level diff: "our site" changed to "the website" within link.
			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content:
							'Visit <a href="https://example.com"><del title="Removed" class="revision-diff-removed">our</del><ins title="Added" class="revision-diff-added">the</ins> <del title="Removed" class="revision-diff-removed">site</del><ins title="Added" class="revision-diff-added">website</ins></a> today',
						__revisionDiffStatus: 'modified',
					},
				},
			] );
		} );

		it( 'detects unchanged paragraph with mixed formatting', () => {
			const content = serialize( [
				createBlock( 'core/paragraph', {
					content:
						'This has <strong>bold</strong>, <em>italic</em>, and <a href="https://example.com">links</a>',
				} ),
			] );
			const blocks = diffRevisionContent( content, content );

			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content:
							'This has <strong>bold</strong>, <em>italic</em>, and <a href="https://example.com">links</a>',
						__revisionDiffStatus: undefined,
					},
				},
			] );
		} );

		it( 'detects removed formatting as modification', () => {
			const previous = serialize( [
				createBlock( 'core/paragraph', {
					content: '<strong>Bold</strong> and <em>italic</em> text',
				} ),
			] );
			const current = serialize( [
				createBlock( 'core/paragraph', {
					content: 'Bold and italic text',
				} ),
			] );
			const blocks = diffRevisionContent( current, previous );

			// Format-only change: only "Bold" and "italic" are marked (where formatting was removed).
			// " and " and " text" are not marked since they never had formatting.
			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content:
							'<span title="1 format removed" class="revision-diff-format-removed">Bold</span> and <span title="1 format removed" class="revision-diff-format-removed">italic</span> text',
						__revisionDiffStatus: 'modified',
					},
				},
			] );
		} );

		it( 'detects bold replaced by italic as modification', () => {
			const previous = serialize( [
				createBlock( 'core/paragraph', {
					content: 'Hello <strong>world</strong>',
				} ),
			] );
			const current = serialize( [
				createBlock( 'core/paragraph', {
					content: 'Hello <em>world</em>',
				} ),
			] );
			const blocks = diffRevisionContent( current, previous );

			// Mixed change: bold removed AND italic added = "changed" type (yellow outline).
			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content:
							'Hello <em><span title="1 format added, 1 format removed" class="revision-diff-format-changed">world</span></em>',
						__revisionDiffStatus: 'modified',
					},
				},
			] );
		} );

		it( 'detects unchanged paragraph with inline code', () => {
			const content = serialize( [
				createBlock( 'core/paragraph', {
					content: 'Use the <code>console.log()</code> function',
				} ),
			] );
			const blocks = diffRevisionContent( content, content );

			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Use the <code>console.log()</code> function',
						__revisionDiffStatus: undefined,
					},
				},
			] );
		} );

		it( 'detects text change outside formatting as modification', () => {
			const previous = serialize( [
				createBlock( 'core/paragraph', {
					content: 'Hello <strong>world</strong>!',
				} ),
			] );
			const current = serialize( [
				createBlock( 'core/paragraph', {
					content: 'Goodbye <strong>world</strong>!',
				} ),
			] );
			const blocks = diffRevisionContent( current, previous );

			// Word-level diff: "Hello" changed to "Goodbye" outside the bold formatting.
			expect( normalizeBlockTree( blocks ) ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content:
							'<del title="Removed" class="revision-diff-removed">Hello</del><ins title="Added" class="revision-diff-added">Goodbye</ins> <strong>world</strong>!',
						__revisionDiffStatus: 'modified',
					},
				},
			] );
		} );

		it( 'applies rich text diff to nested block content', () => {
			const previous = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/paragraph', {
						content: 'Hello <strong>world</strong>',
					} ),
				] ),
			] );
			const current = serialize( [
				createBlock( 'core/group', {}, [
					createBlock( 'core/paragraph', {
						content: 'Goodbye <strong>everyone</strong>',
					} ),
				] ),
			] );
			const blocks = diffRevisionContent( current, previous );

			// Word-level diff applied to nested paragraph content.
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
								content:
									'<del title="Removed" class="revision-diff-removed">Hello</del><ins title="Added" class="revision-diff-added">Goodbye</ins> <strong><del title="Removed" class="revision-diff-removed">world</del><ins title="Added" class="revision-diff-added">everyone</ins></strong>',
								__revisionDiffStatus: 'modified',
							},
						},
					],
				},
			] );
		} );
	} );
} );
