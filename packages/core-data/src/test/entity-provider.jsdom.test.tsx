import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';
import {
	RichText,
	useBlockProps,
	BlockEditorProvider,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createRegistry, RegistryProvider, useRegistry } from '@wordpress/data';
// @ts-expect-error `@wordpress/block-library` does not expose type declarations for its entry point.
import { registerCoreBlocks } from '@wordpress/block-library';
import { unregisterFormatType } from '@wordpress/rich-text';
import type { ReactNode } from 'react';
import type { Block } from '@wordpress/blocks';
import { store as coreDataStore } from '../index';
import useEntityBlockEditor from '../hooks/use-entity-block-editor';
import { registerEntitySyncManager } from '../entity-sync';
import type { EntitySyncManager } from '../entity-sync';
import type { EntityBlockEditorHandler } from '../hooks/types';

// Given an ID, the hook returns the blocks of the record.
type EntityBlockEditorWithBlocks = [
	Array< Block >,
	EntityBlockEditorHandler,
	EntityBlockEditorHandler,
];

vi.mock( import( '@wordpress/api-fetch' ) );

const postTypeConfig = {
	kind: 'postType',
	name: 'post',
	baseURL: '/wp/v2/posts',
	transientEdits: { blocks: true, selection: true },
	mergedEdits: { meta: true },
	rawAttributes: [ 'title', 'excerpt', 'content' ],
};

const postTypeEntity = {
	slug: 'post',
	rest_base: 'posts',
	labels: {
		item_updated: 'Updated Post',
		item_published: 'Post published',
		item_reverted_to_draft: 'Post reverted to draft.',
	},
};

const aSinglePost = {
	id: 1,
	type: 'post',
	content: {
		raw: '<!-- wp:test-block-with-array-of-strings --><div><p>apples</p><p></p><p>oranges</p></div><!-- /wp:test-block-with-array-of-strings --><!-- wp:test-block --><p>A paragraph</p><!-- /wp:test-block -->',
		rendered: '<p>A paragraph</p>',
	},
	meta: {
		footnotes: '[]',
	},
};

function createRegistryWithStores( parent?: ReturnType< typeof useRegistry > ) {
	// Create a registry.
	const registry = createRegistry( {}, parent );

	// Register store.
	registry.register( coreDataStore );

	// Register post type entity.
	registry.dispatch( coreDataStore ).addEntities( [ postTypeConfig ] );

	// Store post type entity.
	registry
		.dispatch( coreDataStore )
		.receiveEntityRecords( 'root', 'postType', [ postTypeEntity ] );

	// Store a single post for use by the tests.
	registry
		.dispatch( coreDataStore )
		.receiveEntityRecords( 'postType', 'post', [ aSinglePost ] );

	return registry;
}

describe( 'useEntityBlockEditor', () => {
	let registry: ReturnType< typeof createRegistryWithStores >;

	beforeEach( () => {
		registry = createRegistryWithStores();

		const edit = ( {
			children,
		}: {
			attributes: unknown;
			children?: ReactNode;
		} ) => <>{ children }</>;

		registerBlockType( 'core/test-block', {
			apiVersion: 3,
			supports: {
				className: false,
			},
			save: ( { attributes }: { attributes: { content: string } } ) => {
				const { content } = attributes;
				return (
					<p { ...useBlockProps.save() }>
						<RichText.Content value={ content } />
					</p>
				);
			},
			category: 'text',
			attributes: {
				content: {
					type: 'string',
					source: 'html',
					selector: 'p',
					default: '',
					role: 'content',
				},
			},
			title: 'block title',
			edit,
		} );

		registerBlockType( 'core/test-block-with-array-of-strings', {
			apiVersion: 3,
			supports: {
				className: false,
			},
			save: ( {
				attributes,
			}: {
				attributes: { items: Array< string | null > };
			} ) => {
				const { items } = attributes;
				return (
					<div>
						{ items.map( ( item, index ) => (
							<p key={ index }>{ item }</p>
						) ) }
					</div>
				);
			},
			category: 'text',
			attributes: {
				items: {
					type: 'array',
					items: {
						type: 'string',
					},
					default: [ 'apples', null, 'oranges' ],
				},
			},
			title: 'block title',
			edit,
		} );

		registerCoreBlocks();
	} );

	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
		unregisterFormatType( 'core/footnote' );
	} );

	it( 'delivers a paragraph split and later typing through one engine method', () => {
		// The real provider also uses registered shortcut and preference stores.
		const { result } = renderHook( () => useRegistry() );
		registry = createRegistryWithStores( result.current );
		registry.register( blockEditorStore );
		registry
			.dispatch( coreDataStore )
			.receiveEntityRecords( 'postType', 'post', [
				{
					id: 1,
					type: 'post',
					content: {
						raw: '<!-- wp:paragraph --><p>abcd</p><!-- /wp:paragraph -->',
					},
					meta: {},
				},
			] );
		const applyEditBatch =
			vi.fn< NonNullable< EntitySyncManager[ 'applyEditBatch' ] > >();
		const unregister = registerEntitySyncManager( {
			load: vi.fn(),
			unload: vi.fn(),
			unloadAll: vi.fn(),
			applyEditBatch,
		} );
		let editorRegistry!: ReturnType< typeof useRegistry >;
		function CaptureRegistry() {
			editorRegistry = useRegistry();
			return null;
		}
		function Editor() {
			const [ blocks, onInput, onChange ] = useEntityBlockEditor(
				'postType',
				'post',
				{ id: 1 }
			);
			return (
				<BlockEditorProvider
					value={ blocks }
					onInput={ onInput }
					onChange={ onChange }
				>
					<CaptureRegistry />
				</BlockEditorProvider>
			);
		}
		let view: ReturnType< typeof render > | undefined;
		try {
			view = render(
				<RegistryProvider value={ registry }>
					<Editor />
				</RegistryProvider>
			);
			const [ original ] = editorRegistry
				.select( blockEditorStore )
				.getBlocks();
			act( () => {
				editorRegistry.dispatch( blockEditorStore ).resetSelection(
					{
						clientId: original.clientId,
						attributeKey: 'content',
						offset: 2,
					},
					{
						clientId: original.clientId,
						attributeKey: 'content',
						offset: 2,
					}
				);
				editorRegistry
					.dispatch( blockEditorStore )
					.__unstableSplitSelection();
			} );
			const [ head, tail ] = editorRegistry
				.select( blockEditorStore )
				.getBlocks();
			expect( head.clientId ).toBe( original.clientId );
			expect( head.attributes.content ).toBe( 'ab' );
			expect( tail.attributes.content ).toBe( 'cd' );
			expect( applyEditBatch ).toHaveBeenCalledExactlyOnceWith(
				'postType',
				'post',
				1,
				{
					operations: [
						{
							type: 'set-attribute',
							clientId: head.clientId,
							attribute: 'content',
							previousValue: original.attributes.content,
							value: 'ab',
						},
						{
							type: 'insert',
							block: tail,
							parent: null,
							before: null,
						},
					],
					selection: expect.any( Object ),
					options: { isCached: false, undoIgnore: false },
				}
			);
			applyEditBatch.mockClear();
			act( () => {
				editorRegistry
					.dispatch( blockEditorStore )
					.updateBlockAttributes( tail.clientId, { content: 'cde' } );
			} );
			expect( applyEditBatch ).toHaveBeenCalledTimes( 1 );
			expect( applyEditBatch.mock.calls[ 0 ][ 3 ].operations ).toEqual( [
				{
					type: 'set-attribute',
					clientId: tail.clientId,
					attribute: 'content',
					previousValue: 'cd',
					value: 'cde',
				},
			] );
		} finally {
			view?.unmount();
			unregister();
		}
	} );

	it.each( [ false, true ] )(
		'delivers one batch through the entity hook including footnote rewrites (%s)',
		( hasFootnote ) => {
			let blocks!: Block[], onChange!: EntityBlockEditorHandler;
			const applyEditBatch = vi.fn();
			const unregister = registerEntitySyncManager( {
				load: vi.fn(),
				unload: vi.fn(),
				unloadAll: vi.fn(),
				applyEditBatch,
			} );
			const TestComponent = () => {
				[ blocks, , onChange ] = useEntityBlockEditor(
					'postType',
					'post',
					{ id: 1 }
				) as EntityBlockEditorWithBlocks;
				return null;
			};
			try {
				render(
					<RegistryProvider value={ registry }>
						<TestComponent />
					</RegistryProvider>
				);
				const inserted = createBlock( 'core/test-block', {
					content: hasFootnote
						? '<sup data-fn="1234" class="fn"><a href="#1234" id="1234-link">99</a></sup>'
						: 'Plain text',
				} );
				const operations = [
					{
						type: 'insert' as const,
						block: inserted,
						parent: null,
						before: null,
					},
				];
				act( () => {
					onChange( [ ...blocks, inserted ], {
						blockOperations: operations,
					} );
				} );
				const rewrittenOperations = [
					{
						type: 'set-field',
						field: 'meta',
						previousValue: { footnotes: '[]' },
						value: { footnotes: expect.stringContaining( '1234' ) },
					},
					...operations,
					{
						type: 'set-attribute',
						clientId: inserted.clientId,
						attribute: 'content',
						previousValue: inserted.attributes.content,
						value: '<sup data-fn="1234" class="fn"><a href="#1234" id="1234-link">1</a></sup>',
					},
				];
				expect( applyEditBatch ).toHaveBeenCalledExactlyOnceWith(
					'postType',
					'post',
					1,
					{
						operations: hasFootnote
							? rewrittenOperations
							: operations,
						selection: undefined,
						options: { isCached: false, undoIgnore: false },
					}
				);
				expect(
					registry
						.select( coreDataStore )
						.getEntityRecordEdits( 'postType', 'post', 1 )?.blocks
				).toHaveLength( 3 );
			} finally {
				unregister();
			}
		}
	);

	it( 'does not mutate block attributes that include an array of strings or null values', async () => {
		// Set by the component's first render.
		let blocks!: Array< Block >, onChange!: EntityBlockEditorHandler;
		const TestComponent = () => {
			[ blocks, , onChange ] = useEntityBlockEditor( 'postType', 'post', {
				id: 1,
			} ) as EntityBlockEditorWithBlocks;

			return <div />;
		};

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		expect( blocks[ 0 ].name ).toEqual(
			'core/test-block-with-array-of-strings'
		);
		expect( blocks[ 0 ].attributes.items ).toEqual( [
			'apples',
			null,
			'oranges',
		] );

		// Add a block with content that will match against footnotes logic, causing
		// `updateFootnotes` to iterate over blocks and their attributes.
		act( () => {
			onChange(
				[
					...blocks,
					createBlock( 'core/test-block', {
						content:
							'<p><sup data-fn="1234" class="fn"><a href="#1234" id="1234-link">1</a></sup></p>',
					} ),
				],
				{
					selection: {
						selectionStart: {},
						selectionEnd: {},
						initialPosition: {},
					},
				}
			);
		} );

		// Ensure the first block remains the same, with unaltered attributes.
		expect( blocks[ 0 ].name ).toEqual(
			'core/test-block-with-array-of-strings'
		);
		expect( blocks[ 0 ].attributes.items ).toEqual( [
			'apples',
			null,
			'oranges',
		] );
	} );

	it( 'updates the order of footnotes when a new footnote is inserted', async () => {
		// Start with a post containing a block with a single footnote (set to 1).
		registry
			.dispatch( coreDataStore )
			.receiveEntityRecords( 'postType', 'post', [
				{
					id: 1,
					type: 'post',
					content: {
						raw: '<!-- wp:test-block --><p>A paragraph<sup data-fn="abcd" class="fn"><a href="#abcd" id="abcd-link">1</a></sup></p><!-- /wp:test-block -->',
						rendered: '<p>A paragraph</p>',
					},
					meta: {
						footnotes: '[]',
					},
				},
			] );

		// Set by the component's first render.
		let blocks!: Array< Block >, onChange!: EntityBlockEditorHandler;

		const TestComponent = () => {
			[ blocks, , onChange ] = useEntityBlockEditor( 'postType', 'post', {
				id: 1,
			} ) as EntityBlockEditorWithBlocks;

			return <div />;
		};

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		// The first block should have the footnote number 1.
		expect( blocks[ 0 ].attributes.content ).toEqual(
			'A paragraph<sup data-fn="abcd" class="fn"><a href="#abcd" id="abcd-link">1</a></sup>'
		);

		// Add a block with a new footnote with an arbitrary footnote number that will be overwritten after insertion.
		act( () => {
			onChange(
				[
					createBlock( 'core/test-block', {
						content:
							'A new paragraph<sup data-fn="xyz" class="fn"><a href="#xyz" id="xyz-link">999</a></sup>',
					} ),
					...blocks,
				],
				{
					selection: {
						selectionStart: {},
						selectionEnd: {},
						initialPosition: {},
					},
				}
			);
		} );

		// The newly inserted block should have the footnote number 1, and the
		// existing footnote number 1 should be updated to 2.
		expect( blocks[ 0 ].attributes.content ).toEqual(
			'A new paragraph<sup data-fn="xyz" class="fn"><a href="#xyz" id="xyz-link">1</a></sup>'
		);
		expect( blocks[ 1 ].attributes.content ).toEqual(
			'A paragraph<sup data-fn="abcd" class="fn"><a href="#abcd" id="abcd-link">2</a></sup>'
		);
	} );

	it( 'preserves block clientIds across unmount and remount when content is unchanged', () => {
		// Set by the component's first render.
		let blocks!: Array< Block >;
		const TestComponent = () => {
			[ blocks ] = useEntityBlockEditor( 'postType', 'post', {
				id: 1,
			} ) as EntityBlockEditorWithBlocks;
			return <div />;
		};

		const { unmount } = render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		const firstClientIds = blocks.map( ( b ) => b.clientId );
		expect( firstClientIds ).toHaveLength( 2 );

		// Simulate navigating away.
		unmount();

		// Simulate navigating back — same entity, same content.
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		// The cache should return the same block objects with the same clientIds.
		expect( blocks.map( ( b ) => b.clientId ) ).toEqual( firstClientIds );
	} );

	it( 'returns new blocks when content changes', () => {
		// Set by the component's first render.
		let blocks!: Array< Block >;
		const TestComponent = () => {
			[ blocks ] = useEntityBlockEditor( 'postType', 'post', {
				id: 1,
			} ) as EntityBlockEditorWithBlocks;
			return <div />;
		};

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		const firstClientIds = blocks.map( ( b ) => b.clientId );

		// Receive a new entity record with different content.
		act( () => {
			registry
				.dispatch( coreDataStore )
				.receiveEntityRecords( 'postType', 'post', [
					{
						id: 1,
						type: 'post',
						content: {
							raw: '<!-- wp:test-block --><p>Different content</p><!-- /wp:test-block -->',
							rendered: '<p>Different content</p>',
						},
						meta: { footnotes: '[]' },
					},
				] );
		} );

		// Blocks should be new objects with new clientIds.
		expect( blocks ).toHaveLength( 1 );
		expect( blocks[ 0 ].attributes.content ).toEqual( 'Different content' );
		expect( blocks.map( ( b ) => b.clientId ) ).not.toEqual(
			firstClientIds
		);
	} );
} );
