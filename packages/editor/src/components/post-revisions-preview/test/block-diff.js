/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	getBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { diffRevisionContent } from '../block-diff';

describe( 'diffRevisionContent', () => {
	beforeEach( () => {
		// Register a simple paragraph block for testing if not already registered.
		if ( ! getBlockType( 'core/paragraph' ) ) {
			registerBlockType( 'core/paragraph', {
				attributes: {
					content: {
						type: 'string',
						source: 'html',
						selector: 'p',
					},
				},
				save: ( { attributes } ) => <p>{ attributes.content }</p>,
				category: 'text',
				title: 'Paragraph',
			} );
		}

		// Register a group block for testing nested blocks if not already registered.
		if ( ! getBlockType( 'core/group' ) ) {
			registerBlockType( 'core/group', {
				attributes: {},
				save: ( { innerBlocks } ) => (
					<div className="wp-block-group">{ innerBlocks }</div>
				),
				category: 'design',
				title: 'Group',
			} );
		}
	} );

	afterEach( () => {
		if ( getBlockType( 'core/paragraph' ) ) {
			unregisterBlockType( 'core/paragraph' );
		}
		if ( getBlockType( 'core/group' ) ) {
			unregisterBlockType( 'core/group' );
		}
	} );

	it( 'marks all blocks as added when no previous content', () => {
		const current =
			'<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->';
		const blocks = diffRevisionContent( current, '' );

		expect( blocks ).toHaveLength( 1 );
		expect( blocks[ 0 ].attributes.__revisionDiffStatus ).toBe( 'added' );
	} );

	it( 'marks all blocks as removed when no current content', () => {
		const previous =
			'<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->';
		const blocks = diffRevisionContent( '', previous );

		expect( blocks ).toHaveLength( 1 );
		expect( blocks[ 0 ].attributes.__revisionDiffStatus ).toBe( 'removed' );
	} );

	it( 'leaves unchanged blocks unmarked', () => {
		const content =
			'<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->';
		const blocks = diffRevisionContent( content, content );

		expect( blocks ).toHaveLength( 1 );
		expect( blocks[ 0 ].attributes.__revisionDiffStatus ).toBeUndefined();
	} );

	it( 'detects changed paragraph content as modified', () => {
		const previous =
			'<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->';
		const current =
			'<!-- wp:paragraph --><p>World</p><!-- /wp:paragraph -->';
		const blocks = diffRevisionContent( current, previous );

		// Changed content with same block type is merged into modified.
		expect( blocks ).toHaveLength( 1 );
		expect( blocks[ 0 ].attributes.__revisionDiffStatus ).toBe(
			'modified'
		);

		// Block validation warns about inline diff HTML - this is expected.
		expect( console ).toHaveWarned();
		expect( console ).toHaveErrored();
	} );

	it( 'uses LCS so only changed blocks are marked', () => {
		const previous =
			'<!-- wp:paragraph --><p>A</p><!-- /wp:paragraph -->' +
			'<!-- wp:paragraph --><p>B</p><!-- /wp:paragraph -->';
		const current =
			'<!-- wp:paragraph --><p>NEW</p><!-- /wp:paragraph -->' +
			'<!-- wp:paragraph --><p>A</p><!-- /wp:paragraph -->' +
			'<!-- wp:paragraph --><p>B</p><!-- /wp:paragraph -->';
		const blocks = diffRevisionContent( current, previous );

		expect( blocks ).toHaveLength( 3 );
		// NEW paragraph is added.
		expect( blocks[ 0 ].attributes.__revisionDiffStatus ).toBe( 'added' );
		// A and B are unchanged.
		expect( blocks[ 1 ].attributes.__revisionDiffStatus ).toBeUndefined();
		expect( blocks[ 2 ].attributes.__revisionDiffStatus ).toBeUndefined();
	} );

	it( 'handles inner block changes without marking parent', () => {
		const previous =
			'<!-- wp:group -->' +
			'<div class="wp-block-group">' +
			'<!-- wp:paragraph --><p>A</p><!-- /wp:paragraph -->' +
			'</div>' +
			'<!-- /wp:group -->';
		const current =
			'<!-- wp:group -->' +
			'<div class="wp-block-group">' +
			'<!-- wp:paragraph --><p>A</p><!-- /wp:paragraph -->' +
			'<!-- wp:paragraph --><p>B</p><!-- /wp:paragraph -->' +
			'</div>' +
			'<!-- /wp:group -->';
		const blocks = diffRevisionContent( current, previous );

		expect( blocks ).toHaveLength( 1 );
		// Group should be unchanged.
		expect( blocks[ 0 ].attributes.__revisionDiffStatus ).toBeUndefined();
		// First inner paragraph unchanged.
		expect(
			blocks[ 0 ].innerBlocks[ 0 ].attributes.__revisionDiffStatus
		).toBeUndefined();
		// Second inner paragraph added.
		expect(
			blocks[ 0 ].innerBlocks[ 1 ].attributes.__revisionDiffStatus
		).toBe( 'added' );
	} );

	it( 'handles removed inner blocks', () => {
		const previous =
			'<!-- wp:group -->' +
			'<div class="wp-block-group">' +
			'<!-- wp:paragraph --><p>A</p><!-- /wp:paragraph -->' +
			'<!-- wp:paragraph --><p>B</p><!-- /wp:paragraph -->' +
			'</div>' +
			'<!-- /wp:group -->';
		const current =
			'<!-- wp:group -->' +
			'<div class="wp-block-group">' +
			'<!-- wp:paragraph --><p>A</p><!-- /wp:paragraph -->' +
			'</div>' +
			'<!-- /wp:group -->';
		const blocks = diffRevisionContent( current, previous );

		expect( blocks ).toHaveLength( 1 );
		// Group should be unchanged.
		expect( blocks[ 0 ].attributes.__revisionDiffStatus ).toBeUndefined();
		// First inner paragraph unchanged.
		expect(
			blocks[ 0 ].innerBlocks[ 0 ].attributes.__revisionDiffStatus
		).toBeUndefined();
		// Second inner paragraph removed.
		expect(
			blocks[ 0 ].innerBlocks[ 1 ].attributes.__revisionDiffStatus
		).toBe( 'removed' );
	} );

	it( 'returns empty array for empty content', () => {
		const blocks = diffRevisionContent( '', '' );
		expect( blocks ).toEqual( [] );
	} );

	describe( 'inner blocks', () => {
		it( 'handles deeply nested inner blocks', () => {
			const previous =
				'<!-- wp:group -->' +
				'<div class="wp-block-group">' +
				'<!-- wp:group -->' +
				'<div class="wp-block-group">' +
				'<!-- wp:paragraph --><p>Deep</p><!-- /wp:paragraph -->' +
				'</div>' +
				'<!-- /wp:group -->' +
				'</div>' +
				'<!-- /wp:group -->';
			const current =
				'<!-- wp:group -->' +
				'<div class="wp-block-group">' +
				'<!-- wp:group -->' +
				'<div class="wp-block-group">' +
				'<!-- wp:paragraph --><p>Deep</p><!-- /wp:paragraph -->' +
				'<!-- wp:paragraph --><p>New</p><!-- /wp:paragraph -->' +
				'</div>' +
				'<!-- /wp:group -->' +
				'</div>' +
				'<!-- /wp:group -->';
			const blocks = diffRevisionContent( current, previous );

			expect( blocks ).toHaveLength( 1 );
			// Outer group unchanged.
			expect(
				blocks[ 0 ].attributes.__revisionDiffStatus
			).toBeUndefined();
			// Inner group unchanged.
			expect(
				blocks[ 0 ].innerBlocks[ 0 ].attributes.__revisionDiffStatus
			).toBeUndefined();
			// Deep paragraph unchanged.
			expect(
				blocks[ 0 ].innerBlocks[ 0 ].innerBlocks[ 0 ].attributes
					.__revisionDiffStatus
			).toBeUndefined();
			// New paragraph added.
			expect(
				blocks[ 0 ].innerBlocks[ 0 ].innerBlocks[ 1 ].attributes
					.__revisionDiffStatus
			).toBe( 'added' );
		} );

		it( 'marks all inner blocks when container is added', () => {
			const previous = '';
			const current =
				'<!-- wp:group -->' +
				'<div class="wp-block-group">' +
				'<!-- wp:paragraph --><p>A</p><!-- /wp:paragraph -->' +
				'<!-- wp:paragraph --><p>B</p><!-- /wp:paragraph -->' +
				'</div>' +
				'<!-- /wp:group -->';
			const blocks = diffRevisionContent( current, previous );

			expect( blocks ).toHaveLength( 1 );
			// Group is added.
			expect( blocks[ 0 ].attributes.__revisionDiffStatus ).toBe(
				'added'
			);
			// Inner blocks also marked as added.
			expect(
				blocks[ 0 ].innerBlocks[ 0 ].attributes.__revisionDiffStatus
			).toBe( 'added' );
			expect(
				blocks[ 0 ].innerBlocks[ 1 ].attributes.__revisionDiffStatus
			).toBe( 'added' );
		} );

		it( 'marks all inner blocks when container is removed', () => {
			const previous =
				'<!-- wp:group -->' +
				'<div class="wp-block-group">' +
				'<!-- wp:paragraph --><p>A</p><!-- /wp:paragraph -->' +
				'<!-- wp:paragraph --><p>B</p><!-- /wp:paragraph -->' +
				'</div>' +
				'<!-- /wp:group -->';
			const current = '';
			const blocks = diffRevisionContent( current, previous );

			expect( blocks ).toHaveLength( 1 );
			// Group is removed.
			expect( blocks[ 0 ].attributes.__revisionDiffStatus ).toBe(
				'removed'
			);
			// Inner blocks also marked as removed.
			expect(
				blocks[ 0 ].innerBlocks[ 0 ].attributes.__revisionDiffStatus
			).toBe( 'removed' );
			expect(
				blocks[ 0 ].innerBlocks[ 1 ].attributes.__revisionDiffStatus
			).toBe( 'removed' );
		} );

		it( 'uses LCS for inner blocks so only changed ones are marked', () => {
			const previous =
				'<!-- wp:group -->' +
				'<div class="wp-block-group">' +
				'<!-- wp:paragraph --><p>A</p><!-- /wp:paragraph -->' +
				'<!-- wp:paragraph --><p>B</p><!-- /wp:paragraph -->' +
				'<!-- wp:paragraph --><p>C</p><!-- /wp:paragraph -->' +
				'</div>' +
				'<!-- /wp:group -->';
			const current =
				'<!-- wp:group -->' +
				'<div class="wp-block-group">' +
				'<!-- wp:paragraph --><p>NEW</p><!-- /wp:paragraph -->' +
				'<!-- wp:paragraph --><p>A</p><!-- /wp:paragraph -->' +
				'<!-- wp:paragraph --><p>B</p><!-- /wp:paragraph -->' +
				'<!-- wp:paragraph --><p>C</p><!-- /wp:paragraph -->' +
				'</div>' +
				'<!-- /wp:group -->';
			const blocks = diffRevisionContent( current, previous );

			expect( blocks ).toHaveLength( 1 );
			// Group unchanged.
			expect(
				blocks[ 0 ].attributes.__revisionDiffStatus
			).toBeUndefined();
			// NEW is added.
			expect(
				blocks[ 0 ].innerBlocks[ 0 ].attributes.__revisionDiffStatus
			).toBe( 'added' );
			// A, B, C are unchanged (LCS preserves them).
			expect(
				blocks[ 0 ].innerBlocks[ 1 ].attributes.__revisionDiffStatus
			).toBeUndefined();
			expect(
				blocks[ 0 ].innerBlocks[ 2 ].attributes.__revisionDiffStatus
			).toBeUndefined();
			expect(
				blocks[ 0 ].innerBlocks[ 3 ].attributes.__revisionDiffStatus
			).toBeUndefined();
		} );

		it( 'handles changed inner block content as modified', () => {
			const previous =
				'<!-- wp:group -->' +
				'<div class="wp-block-group">' +
				'<!-- wp:paragraph --><p>Original</p><!-- /wp:paragraph -->' +
				'</div>' +
				'<!-- /wp:group -->';
			const current =
				'<!-- wp:group -->' +
				'<div class="wp-block-group">' +
				'<!-- wp:paragraph --><p>Modified</p><!-- /wp:paragraph -->' +
				'</div>' +
				'<!-- /wp:group -->';
			const blocks = diffRevisionContent( current, previous );

			expect( blocks ).toHaveLength( 1 );
			// Group unchanged.
			expect(
				blocks[ 0 ].attributes.__revisionDiffStatus
			).toBeUndefined();
			// Changed paragraph shows as modified.
			expect( blocks[ 0 ].innerBlocks ).toHaveLength( 1 );
			expect(
				blocks[ 0 ].innerBlocks[ 0 ].attributes.__revisionDiffStatus
			).toBe( 'modified' );

			// Block validation warns about inline diff HTML - this is expected.
			expect( console ).toHaveWarned();
			expect( console ).toHaveErrored();
		} );

		it( 'handles multiple inner block changes at once', () => {
			const previous =
				'<!-- wp:group -->' +
				'<div class="wp-block-group">' +
				'<!-- wp:paragraph --><p>A</p><!-- /wp:paragraph -->' +
				'<!-- wp:paragraph --><p>B</p><!-- /wp:paragraph -->' +
				'<!-- wp:paragraph --><p>C</p><!-- /wp:paragraph -->' +
				'</div>' +
				'<!-- /wp:group -->';
			const current =
				'<!-- wp:group -->' +
				'<div class="wp-block-group">' +
				'<!-- wp:paragraph --><p>A</p><!-- /wp:paragraph -->' +
				'<!-- wp:paragraph --><p>D</p><!-- /wp:paragraph -->' +
				'</div>' +
				'<!-- /wp:group -->';
			const blocks = diffRevisionContent( current, previous );

			expect( blocks ).toHaveLength( 1 );
			// Group unchanged.
			expect(
				blocks[ 0 ].attributes.__revisionDiffStatus
			).toBeUndefined();
			// A unchanged.
			expect(
				blocks[ 0 ].innerBlocks[ 0 ].attributes.__revisionDiffStatus
			).toBeUndefined();
			// B removed.
			expect(
				blocks[ 0 ].innerBlocks[ 1 ].attributes.__revisionDiffStatus
			).toBe( 'removed' );
			// C removed.
			expect(
				blocks[ 0 ].innerBlocks[ 2 ].attributes.__revisionDiffStatus
			).toBe( 'removed' );
			// D added.
			expect(
				blocks[ 0 ].innerBlocks[ 3 ].attributes.__revisionDiffStatus
			).toBe( 'added' );
		} );
	} );
} );
