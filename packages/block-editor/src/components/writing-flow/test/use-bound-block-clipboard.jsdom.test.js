import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { act, render, screen } from '@testing-library/react';
import {
	createBlock,
	parse,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import {
	createElement,
	RawHTML,
	useContext,
	useLayoutEffect,
} from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '../../../store';
import {
	BlockRefs,
	BlockRefsProvider,
} from '../../provider/block-refs-provider';
import withRegistryProvider from '../../provider/with-registry-provider';
import useCanvasClipboardHandler from '../use-clipboard-handler';
import useListViewClipboardHandler from '../../list-view/use-clipboard-handler';

const bindings = {
	content: { source: 'core/post-meta', args: { key: 'movie_field' } },
};

function CanvasSurface() {
	const ref = useCanvasClipboardHandler();
	return createElement( 'div', {
		ref,
		tabIndex: -1,
		'data-testid': 'surface',
	} );
}

function ListViewSurface( { focusedClientId } ) {
	const ref = useListViewClipboardHandler( { selectBlock: vi.fn() } );
	return createElement(
		'div',
		{ ref },
		createElement( 'div', {
			role: 'row',
			'data-block': focusedClientId,
			tabIndex: -1,
			'data-testid': 'surface',
		} )
	);
}

function ClipboardSurface( { Surface, focusedClientId, onReady } ) {
	const registry = useRegistry();
	const { attributesForCopy } = useContext( BlockRefs );
	useLayoutEffect( () => {
		onReady( { registry, attributesForCopy } );
	}, [ registry, attributesForCopy, onReady ] );
	return createElement( Surface, { focusedClientId } );
}

const ClipboardProvider = withRegistryProvider( ( props ) =>
	createElement(
		BlockRefsProvider,
		null,
		createElement( ClipboardSurface, props )
	)
);

function mountClipboard( Surface, blocks ) {
	let clipboardContext;
	render(
		createElement( ClipboardProvider, {
			Surface,
			focusedClientId: blocks[ 0 ].clientId,
			onReady: ( context ) => {
				clipboardContext = context;
			},
		} )
	);
	const { registry, attributesForCopy } = clipboardContext;
	act( () => {
		registry.dispatch( blockEditorStore ).resetBlocks( blocks );
		registry
			.dispatch( blockEditorStore )
			.selectBlock( blocks[ 0 ].clientId );
	} );
	const boundBlock = registry
		.select( blockEditorStore )
		.getBlock( blocks[ 0 ].clientId );
	registerResolvedContent(
		attributesForCopy,
		boundBlock,
		'Bound <strong>text</strong>'
	);
	const surface = screen.getByTestId( 'surface' );
	surface.focus();
	return { registry, surface, boundBlock, attributesForCopy };
}

function registerResolvedContent( attributesForCopy, block, content ) {
	attributesForCopy.set(
		block.clientId,
		new Map( [
			[
				{},
				{
					attributes: block.attributes,
					computedAttributes: { ...block.attributes, content },
					boundAttributeNames: [ 'content' ],
				},
			],
		] )
	);
}

function selectPartialBlocks(
	registry,
	blocks,
	startOffset,
	endOffset,
	reverse
) {
	const start = {
		clientId: blocks[ 0 ].clientId,
		attributeKey: 'content',
		offset: startOffset,
	};
	const end = {
		clientId: blocks[ blocks.length - 1 ].clientId,
		attributeKey: 'content',
		offset: endOffset,
	};
	act( () => {
		registry.dispatch( blockEditorStore ).selectionChange( {
			start: reverse ? end : start,
			end: reverse ? start : end,
		} );
	} );
}

function dispatchClipboardEvent( surface, type ) {
	const clipboardContent = new Map();
	const event = new Event( type, { bubbles: true, cancelable: true } );
	Object.defineProperty( event, 'clipboardData', {
		value: {
			setData: ( format, value ) => clipboardContent.set( format, value ),
		},
	} );
	act( () => {
		surface.dispatchEvent( event );
	} );
	return {
		plainText: clipboardContent.get( 'text/plain' ),
		blocks: parse( clipboardContent.get( 'text/html' ) ),
		defaultPrevented: event.defaultPrevented,
	};
}

describe.each( [
	[ 'canvas', CanvasSurface ],
	[ 'list view', ListViewSurface ],
] )( 'resolved block clipboard in the %s', ( name, Surface ) => {
	beforeAll( () => {
		registerBlockType( 'core/paragraph', {
			apiVersion: 3,
			title: 'Paragraph',
			category: 'text',
			merge: ( attributes, attributesToMerge ) => ( {
				content: attributes.content + attributesToMerge.content,
			} ),
			attributes: {
				metadata: { type: 'object' },
				content: {
					type: 'string',
					source: 'html',
					selector: 'p',
					default: '',
				},
			},
			save: ( { attributes } ) =>
				createElement(
					'p',
					null,
					createElement( RawHTML, null, attributes.content )
				),
		} );
	} );

	afterEach( () => {
		window.getSelection().removeAllRanges();
	} );

	afterAll( () => {
		unregisterBlockType( 'core/paragraph' );
	} );

	it( 'copies a bound block with both resolved text and its binding', () => {
		const originalBlock = createBlock( 'core/paragraph', {
			content: '',
			metadata: { bindings },
		} );
		const { registry, surface, boundBlock } = mountClipboard( Surface, [
			originalBlock,
		] );

		const copied = dispatchClipboardEvent( surface, 'copy' );

		expect( copied.defaultPrevented ).toBe( true );
		expect( copied.plainText ).toBe( 'Bound text' );
		expect( copied.blocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Bound <strong>text</strong>',
					metadata: { bindings },
				},
				isValid: true,
			},
		] );
		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual( [
			boundBlock,
		] );
		expect( boundBlock.attributes.content ).toBe( '' );
	} );

	it( 'includes resolved text when copying bound and normal blocks together', () => {
		const blocks = [
			createBlock( 'core/paragraph', {
				content: '',
				metadata: { bindings },
			} ),
			createBlock( 'core/paragraph', { content: 'Normal paragraph' } ),
		];
		const { registry, surface, boundBlock } = mountClipboard(
			Surface,
			blocks
		);
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.multiSelect( blocks[ 0 ].clientId, blocks[ 1 ].clientId );
		} );

		const copied = dispatchClipboardEvent( surface, 'copy' );

		expect( copied.plainText ).toBe( 'Bound text\n\nNormal paragraph' );
		expect(
			copied.blocks.map( ( block ) => block.attributes.content )
		).toEqual( [ 'Bound <strong>text</strong>', 'Normal paragraph' ] );
		expect( copied.blocks[ 0 ].attributes.metadata.bindings ).toEqual(
			bindings
		);
		expect( boundBlock.attributes.content ).toBe( '' );
		expect( registry.select( blockEditorStore ).getBlocks() ).toHaveLength(
			2
		);
	} );

	it( 'copies the resolved content before removing a cut block', () => {
		const blocks = [
			createBlock( 'core/paragraph', {
				content: '',
				metadata: { bindings },
			} ),
			createBlock( 'core/paragraph', { content: 'Remaining paragraph' } ),
		];
		const { registry, surface, boundBlock } = mountClipboard(
			Surface,
			blocks
		);

		const copied = dispatchClipboardEvent( surface, 'cut' );

		expect( copied.plainText ).toBe( 'Bound text' );
		expect( copied.blocks[ 0 ].attributes ).toEqual( {
			content: 'Bound <strong>text</strong>',
			metadata: { bindings },
		} );
		expect( registry.select( blockEditorStore ).getBlocks() ).toMatchObject(
			[ { attributes: { content: 'Remaining paragraph' } } ]
		);
		expect( boundBlock.attributes.content ).toBe( '' );
	} );

	if ( Surface === CanvasSurface ) {
		it.each( [
			[ '', false ],
			[ '', true ],
			[ 'Saved fallback', false ],
			[ 'Saved fallback', true ],
		] )(
			'copies whole bound endpoint text with rich-text selection offsets (fallback=%j, reverse=%s)',
			( fallback, reverse ) => {
				const blocks = [
					createBlock( 'core/paragraph', {
						content: fallback,
						metadata: { bindings },
					} ),
					createBlock( 'core/paragraph', {
						content: 'Normal paragraph',
					} ),
				];
				const { registry, surface, boundBlock } = mountClipboard(
					Surface,
					blocks
				);
				selectPartialBlocks( registry, blocks, 0, 16, reverse );

				const copied = dispatchClipboardEvent( surface, 'copy' );

				expect( copied.plainText ).toBe(
					'Bound text\n\nNormal paragraph'
				);
				expect( copied.blocks ).toMatchObject( [
					{
						attributes: {
							content: 'Bound <strong>text</strong>',
							metadata: { bindings },
						},
						isValid: true,
					},
					{
						attributes: { content: 'Normal paragraph' },
						isValid: true,
					},
				] );
				expect( boundBlock.attributes.content ).toBe( fallback );
				expect(
					registry.select( blockEditorStore ).getBlocks()[ 0 ]
				).toBe( boundBlock );
			}
		);

		it.each( [ false, true ] )(
			'copies a bound tail using its resolved prefix (reverse=%s)',
			( reverse ) => {
				const blocks = [
					createBlock( 'core/paragraph', {
						content: 'Normal paragraph',
					} ),
					createBlock( 'core/paragraph', {
						content: '',
						metadata: { bindings },
					} ),
				];
				const { registry, surface, attributesForCopy } = mountClipboard(
					Surface,
					blocks
				);
				attributesForCopy.delete( blocks[ 0 ].clientId );
				const boundTail = registry
					.select( blockEditorStore )
					.getBlock( blocks[ 1 ].clientId );
				registerResolvedContent(
					attributesForCopy,
					boundTail,
					'Bound <strong>text</strong>'
				);
				selectPartialBlocks( registry, blocks, 7, 8, reverse );

				const copied = dispatchClipboardEvent( surface, 'copy' );

				expect( copied.plainText ).toBe( 'paragraph\n\nBound te' );
				expect( copied.blocks[ 1 ] ).toMatchObject( {
					attributes: {
						content: 'Bound <strong>te</strong>',
						metadata: { bindings },
					},
					isValid: true,
				} );
				expect( boundTail.attributes.content ).toBe( '' );
			}
		);

		it.each( [ false, true ] )(
			'copies only selected resolved suffix and prefix when both endpoints are bound (reverse=%s)',
			( reverse ) => {
				const blocks = [
					createBlock( 'core/paragraph', {
						content: '',
						metadata: { bindings },
					} ),
					createBlock( 'core/paragraph', {
						content: 'Middle paragraph',
					} ),
					createBlock( 'core/paragraph', {
						content: 'Saved fallback',
						metadata: { bindings },
					} ),
				];
				const { registry, surface, boundBlock, attributesForCopy } =
					mountClipboard( Surface, blocks );
				const boundTail = registry
					.select( blockEditorStore )
					.getBlock( blocks[ 2 ].clientId );
				registerResolvedContent(
					attributesForCopy,
					boundTail,
					'<em>Tail</em> content'
				);
				selectPartialBlocks( registry, blocks, 6, 4, reverse );

				const copied = dispatchClipboardEvent( surface, 'copy' );

				expect( copied.plainText ).toBe(
					'text\n\nMiddle paragraph\n\nTail'
				);
				expect(
					copied.blocks.map( ( block ) => block.attributes.content )
				).toEqual( [
					'<strong>text</strong>',
					'Middle paragraph',
					'<em>Tail</em>',
				] );
				expect(
					copied.blocks[ 0 ].attributes.metadata.bindings
				).toEqual( bindings );
				expect(
					copied.blocks[ 2 ].attributes.metadata.bindings
				).toEqual( bindings );
				expect(
					copied.blocks.every( ( block ) => block.isValid )
				).toBe( true );
				expect( boundBlock.attributes.content ).toBe( '' );
				expect( boundTail.attributes.content ).toBe( 'Saved fallback' );
			}
		);

		it.each( [ 'missing', 'stale', 'duplicate' ] )(
			'uses the saved partial content when the bound snapshot is %s',
			( snapshotStatus ) => {
				const blocks = [
					createBlock( 'core/paragraph', {
						content: 'Saved fallback',
						metadata: { bindings },
					} ),
					createBlock( 'core/paragraph', {
						content: 'Normal paragraph',
					} ),
				];
				const { registry, surface, boundBlock, attributesForCopy } =
					mountClipboard( Surface, blocks );
				if ( snapshotStatus === 'missing' ) {
					attributesForCopy.delete( boundBlock.clientId );
				} else if ( snapshotStatus === 'duplicate' ) {
					const instances = attributesForCopy.get(
						boundBlock.clientId
					);
					instances.set( {}, instances.values().next().value );
				} else {
					act( () => {
						registry
							.dispatch( blockEditorStore )
							.updateBlockAttributes( boundBlock.clientId, {
								content: 'Newer fallback',
							} );
					} );
				}
				selectPartialBlocks( registry, blocks, 6, 6, false );

				const copied = dispatchClipboardEvent( surface, 'copy' );

				expect( copied.plainText ).toBe( 'fallback\n\nNormal' );
				expect( copied.blocks[ 0 ].attributes ).toEqual( {
					content: 'fallback',
					metadata: { bindings },
				} );
			}
		);

		it( 'copies resolved partial content before cutting a rich-text block selection', () => {
			const blocks = [
				createBlock( 'core/paragraph', {
					content: '',
					metadata: { bindings },
				} ),
				createBlock( 'core/paragraph', {
					content: 'Normal paragraph',
				} ),
			];
			const { registry, surface, boundBlock } = mountClipboard(
				Surface,
				blocks
			);
			selectPartialBlocks( registry, blocks, 6, 6, false );

			const copied = dispatchClipboardEvent( surface, 'cut' );

			expect( copied.plainText ).toBe( 'text\n\nNormal' );
			expect( copied.blocks[ 0 ].attributes ).toEqual( {
				content: '<strong>text</strong>',
				metadata: { bindings },
			} );
			expect(
				registry.select( blockEditorStore ).getBlocks()
			).toHaveLength( 1 );
			expect( boundBlock.attributes.content ).toBe( '' );
		} );
	}
} );
