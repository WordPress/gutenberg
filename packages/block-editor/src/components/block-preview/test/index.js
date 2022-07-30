/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	createBlock,
} from '@wordpress/blocks';
import {
	registerCoreBlocks,
	__experimentalGetCoreBlocks,
} from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import { useBlockPreview } from '../';
import { getBlockPreviewPatterns, getPatternsFromBlocks } from '../patterns';

jest.mock( '@wordpress/dom', () => {
	const focus = jest.requireActual( '../../../../../dom/src' ).focus;

	return {
		focus: {
			...focus,
			focusable: {
				...focus.focusable,
				find( context ) {
					// In JSDOM, all elements have zero'd widths and height.
					// This is a metric for focusable's `isVisible`, so find
					// and apply an arbitrary non-zero width.
					Array.from( context.querySelectorAll( '*' ) ).forEach(
						( element ) => {
							Object.defineProperties( element, {
								offsetWidth: {
									get: () => 1,
									configurable: true,
								},
							} );
						}
					);

					return focus.focusable.find( ...arguments );
				},
			},
		},
	};
} );

jest.useRealTimers();

describe( 'getPatternsFromBlocks', () => {
	beforeAll( () => {
		registerBlockType( 'core/test', {
			save: () => (
				<div>
					Test block save view
					<button>Button</button>
				</div>
			),
			edit: () => (
				<div>
					Test block edit view
					<button>Button</button>
				</div>
			),
			category: 'text',
			title: 'test block',
		} );

		registerCoreBlocks();
	} );

	afterAll( () => {
		unregisterBlockType( 'core/test' );

		const allBlocks = __experimentalGetCoreBlocks();

		allBlocks.forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'will return an empty set of patterns present in blocks', async () => {
		const blocks = [];
		blocks.push( createBlock( 'core/test' ) );

		expect( getPatternsFromBlocks( blocks ).size ).toBe( 0 );
	} );

	it( 'will return a set of patterns present in blocks', async () => {
		const blocks = [];
		blocks.push( createBlock( 'core/test' ) );
		blocks.push( createBlock( 'core/pattern', { slug: 'test/test' } ) );

		const patternsFromBlocks = getPatternsFromBlocks( blocks );

		expect( patternsFromBlocks.size ).toBe( 1 );
		expect( patternsFromBlocks.has( 'test/test' ) ).toBe( true );
	} );

	it( 'will return a set of patterns present in blocks by traversing tree', async () => {
		const blocks = [];
		blocks.push(
			createBlock( 'core/group', {}, [
				createBlock( 'core/pattern', { slug: 'test/test2' } ),
			] )
		);
		blocks.push( createBlock( 'core/pattern', { slug: 'test/test' } ) );

		const patternsFromBlocks = getPatternsFromBlocks( blocks );

		expect( patternsFromBlocks.size ).toBe( 2 );
		expect( patternsFromBlocks.has( 'test/test' ) ).toBe( true );
		expect( patternsFromBlocks.has( 'test/test2' ) ).toBe( true );
	} );
} );

describe( 'getBlockPreviewPatterns', () => {
	it( 'will return an empty set of patterns when no patterns are set', async () => {
		const patterns = [];
		const patternsToPreview = [ 'test/test' ];

		expect(
			getBlockPreviewPatterns( patterns, patternsToPreview ).length
		).toBe( 0 );
	} );

	it( 'will return an empty set of patterns when no patterns were found in preview', async () => {
		const patterns = [
			{
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"></div><!-- /wp:group -->',
			},
		];
		const patternsToPreview = new Set();

		expect(
			getBlockPreviewPatterns( patterns, patternsToPreview ).length
		).toBe( 0 );
	} );

	it( 'will return a set of patterns when patterns are found within block preview', async () => {
		const patterns = [
			{
				name: 'test/test',
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"></div><!-- /wp:group -->',
			},
		];
		const patternsToPreview = new Set( [ 'test/test' ] );

		const patternsInPreview = getBlockPreviewPatterns(
			patterns,
			patternsToPreview
		);

		expect( patternsInPreview.length ).toBe( 1 );
		expect( patternsInPreview[ 0 ] ).toBe( patterns[ 0 ] );
	} );

	it( 'will return a set of patterns when patterns are found within block preview and nested patterns are found.', async () => {
		const patterns = [
			{
				name: 'test/test',
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"></div><!-- /wp:group -->',
			},
			{
				name: 'test/nest',
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"><!-- wp:pattern {"slug":"test/test"} /--></div><!-- /wp:group -->',
			},
		];
		const patternsToPreview = new Set( [ 'test/nest' ] );

		const patternsInPreview = getBlockPreviewPatterns(
			patterns,
			patternsToPreview
		);

		expect( patternsInPreview.length ).toBe( 2 );
		expect( patternsInPreview[ 0 ] ).toBe( patterns[ 0 ] );
		expect( patternsInPreview[ 1 ] ).toBe( patterns[ 1 ] );
	} );

	it( 'will return a set of patterns when patterns are found within block preview and nested patterns are found recursively.', async () => {
		const patterns = [
			{
				name: 'test/base',
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"></div><!-- /wp:group -->',
			},
			{
				name: 'test/test',
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"><!-- wp:pattern {"slug":"test/base"} /--></div><!-- /wp:group -->',
			},
			{
				name: 'test/nest',
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"><!-- wp:pattern {"slug":"test/test"} /--></div><!-- /wp:group -->',
			},
		];
		const patternsToPreview = new Set( [ 'test/nest' ] );

		const patternsInPreview = getBlockPreviewPatterns(
			patterns,
			patternsToPreview
		);

		expect( patternsInPreview.length ).toBe( 3 );
		expect( patternsInPreview[ 0 ] ).toBe( patterns[ 0 ] );
		expect( patternsInPreview[ 1 ] ).toBe( patterns[ 1 ] );
		expect( patternsInPreview[ 2 ] ).toBe( patterns[ 2 ] );
	} );

	it( 'will return a set of patterns when patterns are found within block preview and nested patterns are found recursively but duplicate patterns are found.', async () => {
		const patterns = [
			{
				name: 'test/base',
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"></div><!-- /wp:group -->',
			},
			{
				name: 'test/base2',
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"><!-- wp:pattern {"slug":"test/base"} /--></div><!-- /wp:group -->',
			},
			{
				name: 'test/test',
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"><!-- wp:pattern {"slug":"test/base"} /--><!-- wp:pattern {"slug":"test/base2"} /--></div><!-- /wp:group -->',
			},
			{
				name: 'test/nest',
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"><!-- wp:pattern {"slug":"test/test"} /--></div><!-- /wp:group -->',
			},
		];
		const patternsToPreview = new Set( [ 'test/nest' ] );

		const patternsInPreview = getBlockPreviewPatterns(
			patterns,
			patternsToPreview
		);

		expect( patternsInPreview.length ).toBe( 4 );
		expect( patternsInPreview[ 0 ] ).toBe( patterns[ 0 ] );
		expect( patternsInPreview[ 1 ] ).toBe( patterns[ 1 ] );
		expect( patternsInPreview[ 2 ] ).toBe( patterns[ 2 ] );
		expect( patternsInPreview[ 3 ] ).toBe( patterns[ 3 ] );
	} );

	it( 'will return a set of patterns when patterns are found within block preview but nested patterns are not found.', async () => {
		const patterns = [
			{
				name: 'test/test',
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"></div><!-- /wp:group -->',
			},
			{
				name: 'test/nest',
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"></div><!-- /wp:group -->',
			},
		];
		const patternsToPreview = new Set( [ 'test/nest' ] );

		const patternsInPreview = getBlockPreviewPatterns(
			patterns,
			patternsToPreview
		);

		expect( patternsInPreview.length ).toBe( 1 );
		expect( patternsInPreview[ 0 ] ).toBe( patterns[ 1 ] );
	} );

	it( 'will return a set of patterns when patterns are found within block preview but pattern content is empty.', async () => {
		const patterns = [
			{
				name: 'test/test',
				title: 'Test Pattern',
				content:
					'<!-- wp:group --><div class="wp-block-group"></div><!-- /wp:group -->',
			},
			{
				name: 'test/nest',
				title: 'Test Pattern',
				content: '',
			},
		];
		const patternsToPreview = new Set( [ 'test/nest' ] );

		const patternsInPreview = getBlockPreviewPatterns(
			patterns,
			patternsToPreview
		);

		expect( patternsInPreview.length ).toBe( 1 );
		expect( patternsInPreview[ 0 ] ).toBe( patterns[ 1 ] );
	} );
} );

describe( 'useBlockPreview', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			save: () => (
				<div>
					Test block save view
					<button>Button</button>
				</div>
			),
			edit: () => (
				<div>
					Test block edit view
					<button>Button</button>
				</div>
			),
			category: 'text',
			title: 'test block',
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/test-block' );
	} );

	function BlockPreviewComponent( { blocks, className } ) {
		const blockPreviewProps = useBlockPreview( {
			blocks,
			props: { className },
		} );
		return <div { ...blockPreviewProps } />;
	}

	it( 'will render a block preview with minimal nesting', async () => {
		const blocks = [];
		blocks.push( createBlock( 'core/test-block' ) );

		const { container } = render(
			<BlockPreviewComponent
				className="test-container-classname"
				blocks={ blocks }
			/>
		);

		// Test block and block contents are rendered.
		const previewedBlock = screen.getByLabelText( 'Block: test block' );
		const previewedBlockContents = screen.getByText(
			'Test block edit view'
		);
		expect( previewedBlockContents ).toBeInTheDocument();

		// Test elements within block contents are disabled.
		await waitFor( () => {
			const button = screen.getByText( 'Button' );
			expect( button.hasAttribute( 'disabled' ) ).toBe( true );
		} );

		// Ensure the block preview class names are merged with the component's class name.
		expect( container.firstChild.className ).toBe(
			'test-container-classname block-editor-block-preview__live-content components-disabled'
		);

		// Ensure there is no nesting between the parent component and rendered blocks.
		expect( container.firstChild.firstChild ).toBe( previewedBlock );
	} );
} );
