/**
 * External dependencies
 */
import { render, renderHook, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { dispatch, select as globalSelect, useSelect } from '@wordpress/data';
import { RawHTML } from '@wordpress/element';
import {
	createBlock,
	getBlockTypes,
	parse,
	registerBlockBindingsSource,
	registerBlockType,
	serialize,
	unregisterBlockBindingsSource,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { BlockContextProvider } from '../../block-context';
import useBlockSync from '../../provider/use-block-sync';
import { SelectionContext } from '../../provider/selection-context';
import {
	boundInnerBlocksAncestry,
	getInnerBlocksBinding,
	getInnerBlocksBindingKey,
	useBoundInnerBlocksProps,
	useInnerBlocksBindingKey,
} from '../use-bound-inner-blocks';

const PARAGRAPH_MARKUP =
	'<!-- wp:paragraph -->\n<p>Bound paragraph</p>\n<!-- /wp:paragraph -->';

describe( 'useBoundInnerBlocksProps', () => {
	const registeredSources = [];
	let mountedHooks = [];

	function registerSource( name, source ) {
		registerBlockBindingsSource( { name, label: name, ...source } );
		registeredSources.push( name );
	}

	// Renders the hook and tracks it so it can be unmounted inside `act` during
	// teardown. The hook's `useSelect` subscriptions would otherwise flush a
	// store notification during the automatic, out-of-`act` cleanup. The
	// binding is derived reactively from the block's attributes with the same
	// `getInnerBlocksBinding` predicate production code uses.
	function renderBoundHook( clientId, options ) {
		const view = renderHook( () => {
			const binding = useSelect(
				( select ) =>
					getInnerBlocksBinding(
						select( blockEditorStore ).getBlockAttributes(
							clientId
						)
					),
				[]
			);
			return useBoundInnerBlocksProps( clientId, binding );
		}, options );
		mountedHooks.push( view );
		return view;
	}

	beforeEach( () => {
		registerBlockType( 'core/paragraph', {
			apiVersion: 3,
			category: 'text',
			title: 'Paragraph',
			attributes: {
				content: { type: 'string', source: 'html', selector: 'p' },
			},
			save: ( { attributes } ) => (
				<p>
					<RawHTML>{ attributes.content }</RawHTML>
				</p>
			),
		} );
		registerBlockType( 'core/test-container', {
			apiVersion: 3,
			category: 'text',
			title: 'Test container',
			usesContext: [ 'test/block-type-context' ],
			attributes: {
				metadata: { type: 'object' },
				stored: { type: 'string' },
			},
			save: () => null,
		} );
	} );

	afterEach( async () => {
		// Unmount inside `act` so each hook's `useSelect` subscription teardown
		// (and any pending store notification) is flushed before the store and
		// block types are reset, rather than landing as an out-of-`act` update
		// during the automatic cleanup.
		await act( async () => {
			mountedHooks.forEach( ( { unmount } ) => unmount() );
		} );
		mountedHooks = [];
		dispatch( blockEditorStore ).resetBlocks( [] );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
		registeredSources.forEach( ( name ) =>
			unregisterBlockBindingsSource( name )
		);
		registeredSources.length = 0;
	} );

	function setupBlock( metadata ) {
		const block = createBlock(
			'core/test-container',
			metadata ? { metadata } : {}
		);
		// Reset blocks inside `act` so the resulting store notification settles
		// before the hook renders, keeping the initial render free of a
		// follow-up out-of-`act` update.
		act( () => {
			dispatch( blockEditorStore ).resetBlocks( [ block ] );
		} );
		return block.clientId;
	}

	// Mirrors the state the production sync engine establishes while a binding
	// is applied: `ControlledInnerBlocks`' `useBlockSync` flags the container
	// as having controlled inner blocks (before its first subscriber run) and
	// seeds the store children from the resolved value. Unit tests that
	// exercise write-back or release behavior seed the same state, because the
	// resolver keys off it: writes for a container the sync engine does not
	// own are dropped, and the release capture reads the store children.
	function markContainerControlled( clientId, blocks ) {
		act( () => {
			dispatch( blockEditorStore ).setHasControlledInnerBlocks(
				clientId,
				true
			);
			if ( blocks ) {
				dispatch( blockEditorStore ).replaceInnerBlocks(
					clientId,
					blocks
				);
			}
		} );
	}

	it( 'returns undefined for a falsy clientId', () => {
		const { result } = renderBoundHook( '' );

		expect( result.current ).toBeUndefined();
	} );

	it( 'returns undefined for a block without any bindings', () => {
		const clientId = setupBlock();

		const { result } = renderBoundHook( clientId );

		expect( result.current ).toBeUndefined();
	} );

	it( 'returns undefined for a block with an unrelated attribute binding', () => {
		const clientId = setupBlock( {
			bindings: {
				content: { source: 'core/post-meta', args: { key: 'x' } },
			},
		} );

		const { result } = renderBoundHook( clientId );

		expect( result.current ).toBeUndefined();
	} );

	it( 'returns undefined when the bound source is not registered', () => {
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/unknown-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );

		expect( result.current ).toBeUndefined();
	} );

	it.each( [
		[ 'non-string source', { source: { name: 'core/test-source' } } ],
		[ 'empty source', { source: '' } ],
	] )(
		'returns undefined when the innerBlocks binding has a malformed %s',
		( _label, innerBlocksBinding ) => {
			const clientId = setupBlock( {
				bindings: {
					innerBlocks: innerBlocksBinding,
				},
			} );

			const { result } = renderBoundHook( clientId );

			expect( result.current ).toBeUndefined();
		}
	);

	// Read path: a serialized string resolves to controlled blocks.
	it( 'parses the serialized source string into controlled value blocks', () => {
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: {
					source: 'core/test-source',
					args: { key: 'hero' },
				},
			},
		} );

		const { result } = renderBoundHook( clientId );

		expect( result.current ).toBeDefined();
		expect( Array.isArray( result.current.value ) ).toBe( true );
		expect( result.current.value ).toHaveLength( 1 );
		expect( result.current.value[ 0 ].name ).toBe( 'core/paragraph' );
		expect( result.current.value[ 0 ].attributes.content ).toBe(
			'Bound paragraph'
		);
		expect( typeof result.current.onChange ).toBe( 'function' );
		expect( typeof result.current.onInput ).toBe( 'function' );
	} );

	// The source receives the documented batch shape.
	it( 'calls getValues with the documented innerBlocks bindings shape', () => {
		const getValues = jest.fn( () => ( {
			innerBlocks: PARAGRAPH_MARKUP,
		} ) );
		registerSource( 'core/test-source', { getValues } );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: {
					source: 'core/test-source',
					args: { key: 'hero' },
				},
			},
		} );

		renderBoundHook( clientId );

		expect( getValues ).toHaveBeenCalledWith(
			expect.objectContaining( {
				clientId,
				bindings: { innerBlocks: { args: { key: 'hero' } } },
			} )
		);
	} );

	it( 'passes block type and source context values to getValues', () => {
		const getValues = jest.fn( () => ( {
			innerBlocks: PARAGRAPH_MARKUP,
		} ) );
		registerSource( 'core/test-source', {
			usesContext: [ 'test/source-context' ],
			getValues,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: {
					source: 'core/test-source',
					args: { key: 'hero' },
				},
			},
		} );

		const wrapper = ( { children } ) => (
			<BlockContextProvider
				value={ {
					'test/block-type-context': 'from-block-type',
					'test/source-context': 'from-source',
				} }
			>
				{ children }
			</BlockContextProvider>
		);

		renderBoundHook( clientId, { wrapper } );

		expect( getValues ).toHaveBeenCalledWith(
			expect.objectContaining( {
				context: {
					'test/block-type-context': 'from-block-type',
					'test/source-context': 'from-source',
				},
			} )
		);
	} );

	// Absence (`undefined`) leaves the block uncontrolled so it can render
	// its own fallback children.
	it( 'returns undefined when the source value is undefined (absence)', () => {
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: undefined } ),
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );

		expect( result.current ).toBeUndefined();
	} );

	// Absence (`null`) leaves the block uncontrolled so it can render its
	// own fallback children.
	it( 'returns undefined when the source value is null (absence)', () => {
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: null } ),
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );

		expect( result.current ).toBeUndefined();
	} );

	// Empty string means an intentionally empty controlled area.
	it( 'returns controlled value of [] for an empty string (intentionally empty)', () => {
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: '' } ),
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );

		expect( result.current ).toBeDefined();
		expect( result.current.value ).toEqual( [] );
		expect( typeof result.current.onChange ).toBe( 'function' );
	} );

	// Write-back: editing serializes the subtree and calls setValues.
	it( 'serializes the edited subtree and calls setValues on persistent change', () => {
		const setValues = jest.fn();
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: '' } ),
			setValues,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: {
					source: 'core/test-source',
					args: { key: 'hero' },
				},
			},
		} );

		const { result } = renderBoundHook( clientId );
		markContainerControlled( clientId );

		const newBlocks = [
			createBlock( 'core/paragraph', { content: 'Edited' } ),
		];
		act( () => {
			result.current.onChange( newBlocks, {} );
		} );

		expect( setValues ).toHaveBeenCalledTimes( 1 );
		const call = setValues.mock.calls[ 0 ][ 0 ];
		expect( call.clientId ).toBe( clientId );
		expect( call.bindings.innerBlocks.args ).toEqual( { key: 'hero' } );
		expect( call.bindings.innerBlocks.newValue ).toBe(
			serialize( newBlocks )
		);
		// Round-trips back to the same block.
		expect( parse( call.bindings.innerBlocks.newValue )[ 0 ].name ).toBe(
			'core/paragraph'
		);
	} );

	// Transient input also writes back.
	it( 'serializes and calls setValues on transient input', () => {
		const setValues = jest.fn();
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: '' } ),
			setValues,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );
		markContainerControlled( clientId );

		const newBlocks = [
			createBlock( 'core/paragraph', { content: 'Typing' } ),
		];
		act( () => {
			result.current.onInput( newBlocks, {} );
		} );

		expect( setValues ).toHaveBeenCalledTimes( 1 );
		expect(
			setValues.mock.calls[ 0 ][ 0 ].bindings.innerBlocks.newValue
		).toBe( serialize( newBlocks ) );
	} );

	// Echo stability: when `getValues` returns the exact
	// string the resolver just emitted from a write, the controlled `value`
	// keeps a stable reference rather than re-parsing into a fresh block array
	// (which would look foreign to `useBlockSync` and reset the subtree).
	it( 'keeps the controlled value reference-stable when getValues echoes the just-written string', () => {
		// The source persists the written string into the container's
		// `metadata.bindings.innerBlocks.args.stored` slot and reads it back
		// from there, so `useSelect` re-derives `serialized` from real store
		// state (a store notification fires) — mirroring how a real source
		// round-trips a write through `getValues`.
		const setValues = jest.fn( ( { select, clientId: id, bindings } ) => {
			const metadata =
				select( blockEditorStore ).getBlockAttributes( id ).metadata;
			dispatch( blockEditorStore ).updateBlockAttributes( id, {
				metadata: {
					...metadata,
					bindings: {
						...metadata.bindings,
						innerBlocks: {
							...metadata.bindings.innerBlocks,
							args: { stored: bindings.innerBlocks.newValue },
						},
					},
				},
			} );
		} );
		registerSource( 'core/test-source', {
			getValues: ( { bindings } ) => ( {
				innerBlocks: bindings.innerBlocks.args?.stored ?? '',
			} ),
			setValues,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );
		markContainerControlled( clientId );

		// Write a tree; the resolver caches the emitted { serialized, blocks }
		// and the source stores it, so the next read echoes that exact string.
		const edited = [
			createBlock( 'core/paragraph', { content: 'Echoed' } ),
		];
		act( () => {
			result.current.onChange( edited, {} );
		} );

		const echoedValue = result.current.value;
		expect( echoedValue[ 0 ].attributes.content ).toBe( 'Echoed' );

		// Writing the same blocks again echoes the same string; the controlled
		// value must stay reference-equal rather than re-parse to a fresh array.
		act( () => {
			result.current.onChange( edited, {} );
		} );
		expect( result.current.value ).toBe( echoedValue );
	} );

	// A genuinely different serialized string produces a
	// new (reference-changed) value — the cache only short-circuits an exact
	// echo of the last write, never a real external change.
	it( 'produces a new value reference when the source string genuinely changes', () => {
		let stored = PARAGRAPH_MARKUP;
		// A write that stores a string different from `newValue`, so the next
		// read is not an echo of what the resolver emitted and must parse fresh.
		// The `args` change forces the `serialized` selector's deps to change so
		// `useSelect` re-derives the read (mirroring a real external change).
		let version = 0;
		const setValues = jest.fn( ( { select, clientId: id } ) => {
			stored =
				'<!-- wp:paragraph -->\n<p>Different</p>\n<!-- /wp:paragraph -->';
			version += 1;
			const metadata =
				select( blockEditorStore ).getBlockAttributes( id ).metadata;
			dispatch( blockEditorStore ).updateBlockAttributes( id, {
				metadata: {
					...metadata,
					bindings: {
						...metadata.bindings,
						innerBlocks: {
							...metadata.bindings.innerBlocks,
							args: { version },
						},
					},
				},
			} );
		} );
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: stored } ),
			setValues,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );
		markContainerControlled( clientId );
		const firstValue = result.current.value;
		expect( firstValue[ 0 ].attributes.content ).toBe( 'Bound paragraph' );

		// The write stores a different string than it emitted (not an echo).
		act( () => {
			result.current.onChange(
				[ createBlock( 'core/paragraph', { content: 'Ignored' } ) ],
				{}
			);
		} );

		expect( result.current.value ).not.toBe( firstValue );
		expect( result.current.value[ 0 ].attributes.content ).toBe(
			'Different'
		);
	} );

	// onInput is a transient edit: when the source writes through the
	// block-editor store, the write is marked not-persistent so mid-typing
	// does not spam undo history, while onChange is a persistent edit that
	// does not mark the change, so a completed edit lands as exactly one
	// coherent undo level.
	it( 'routes onInput through a non-persistent write and onChange through a persistent write', () => {
		// The source persists through the block-editor store using the
		// dispatch handed to `setValues`, so the transient mark applies to
		// its write.
		const setValues = jest.fn(
			( { dispatch: sourceDispatch, clientId: id, bindings } ) => {
				sourceDispatch( blockEditorStore ).updateBlockAttributes( id, {
					stored: bindings.innerBlocks.newValue,
				} );
			}
		);
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: '' } ),
			setValues,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const markNotPersistent = jest.spyOn(
			dispatch( blockEditorStore ),
			'__unstableMarkNextChangeAsNotPersistent'
		);

		const { result } = renderBoundHook( clientId );
		markContainerControlled( clientId );

		const blocks = [
			createBlock( 'core/paragraph', { content: 'Typing' } ),
		];

		// Transient input: marks the source's block-editor write as
		// not-persistent.
		act( () => {
			result.current.onInput( blocks, {} );
		} );
		expect( setValues ).toHaveBeenCalledTimes( 1 );
		expect( markNotPersistent ).toHaveBeenCalledTimes( 1 );
		expect(
			globalSelect( blockEditorStore ).isLastBlockChangePersistent()
		).toBe( false );

		// Persistent change: does not mark the change as not-persistent.
		markNotPersistent.mockClear();
		setValues.mockClear();
		act( () => {
			result.current.onChange(
				[ createBlock( 'core/paragraph', { content: 'Committed' } ) ],
				{}
			);
		} );
		expect( setValues ).toHaveBeenCalledTimes( 1 );
		expect( markNotPersistent ).not.toHaveBeenCalled();

		markNotPersistent.mockRestore();
	} );

	// The not-persistent mark taints whichever action next reaches the
	// block-editor reducer. A source that persists elsewhere (e.g. a
	// core-data entity) never consumes it, so arming it up front would make
	// the user's NEXT unrelated edit non-persistent (no undo level). The
	// mark must only be armed when the source dispatches to the block-editor
	// store.
	it( 'does not arm the non-persistent mark for a source that does not write through the block-editor store', () => {
		// Persists outside the block-editor store: no dispatch to it.
		const setValues = jest.fn();
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: '' } ),
			setValues,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const markNotPersistent = jest.spyOn(
			dispatch( blockEditorStore ),
			'__unstableMarkNextChangeAsNotPersistent'
		);

		const { result } = renderBoundHook( clientId );
		markContainerControlled( clientId );

		act( () => {
			result.current.onInput(
				[ createBlock( 'core/paragraph', { content: 'Typing' } ) ],
				{}
			);
		} );
		expect( setValues ).toHaveBeenCalledTimes( 1 );
		expect( markNotPersistent ).not.toHaveBeenCalled();

		// The user's next unrelated edit must land as its own persistent
		// change (a dangling mark would record it as non-persistent, merging
		// it into the previous undo level).
		act( () => {
			dispatch( blockEditorStore ).updateBlockAttributes( clientId, {
				stored: 'unrelated edit',
			} );
		} );
		expect(
			globalSelect( blockEditorStore ).isLastBlockChangePersistent()
		).toBe( true );

		markNotPersistent.mockRestore();
	} );

	// Undo/redo guard: a transient write that merely echoes the source's
	// current value must not call setValues. This is the no-op echo an ancestor
	// controller reset produces when it re-clones this subtree during undo/redo:
	// the shared `useBlockSync` subscription fires before the controlled-value
	// reset effect and reports the still-live children as a not-persistent
	// change. Re-asserting that value would clobber the undo. A persistent
	// commit of the same value still writes so a completed edit lands as one
	// coherent undo level.
	it( 'skips a transient write that echoes the source value but keeps the persistent write', () => {
		// A canonical source string so `serialize( parse( string ) ) === string`,
		// matching what the resolver records as the last-known value on read.
		const canonical = serialize( [
			createBlock( 'core/paragraph', { content: 'Bound' } ),
		] );
		const setValues = jest.fn();
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: canonical } ),
			setValues,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );
		markContainerControlled( clientId );

		// Transient echo of the current value (the ancestor-reset reclone case):
		// serialize equals the source's current value → no write.
		act( () => {
			result.current.onInput( result.current.value, {} );
		} );
		expect( setValues ).not.toHaveBeenCalled();

		// A persistent commit of the same value still seals the edit, even when
		// its serialized output matches the last-known value.
		act( () => {
			result.current.onChange( result.current.value, {} );
		} );
		expect( setValues ).toHaveBeenCalledTimes( 1 );

		// A transient write whose content genuinely differs is not an echo and
		// is persisted.
		act( () => {
			result.current.onInput(
				[ createBlock( 'core/paragraph', { content: 'Typed' } ) ],
				{}
			);
		} );
		expect( setValues ).toHaveBeenCalledTimes( 2 );
	} );

	// Read-only: canUserEditValue false means templateLock + no appender.
	it( 'locks the area when canUserEditValue is false', () => {
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues: jest.fn(),
			canUserEditValue: () => false,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );

		expect( result.current.templateLock ).toBe( 'all' );
		expect( result.current.renderAppender ).toBe( false );
	} );

	// Read-only areas do not write back on change.
	it( 'does not call setValues when the area is read-only', () => {
		const setValues = jest.fn();
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues,
			canUserEditValue: () => false,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );
		markContainerControlled( clientId );

		act( () => {
			result.current.onChange(
				[ createBlock( 'core/paragraph', { content: 'No' } ) ],
				{}
			);
		} );

		expect( setValues ).not.toHaveBeenCalled();
	} );

	// Ownership guard: an entity-driven reset (undo/redo) can re-take
	// ownership of the container — clearing its controlled flag — in the same
	// tick it removes the binding. The still-subscribed sync engine then
	// reports the entity's restored children as an outgoing edit; writing
	// them back would clobber the source value, so the resolver drops writes
	// for a container the sync engine does not own.
	it( 'drops a write for a container the sync engine does not own', () => {
		const setValues = jest.fn();
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );

		// The container was never flagged as controlled (or the flag was
		// cleared by a reset): the write must be dropped.
		act( () => {
			result.current.onChange(
				[ createBlock( 'core/paragraph', { content: 'Restored' } ) ],
				{}
			);
		} );

		expect( setValues ).not.toHaveBeenCalled();
	} );

	// Editable areas are not locked by the resolver.
	it( 'does not lock the area when canUserEditValue is true', () => {
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues: jest.fn(),
			canUserEditValue: () => true,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );

		expect( result.current.templateLock ).toBeUndefined();
		expect( result.current.renderAppender ).toBeUndefined();
	} );

	// Write-back failure surfaces when setValues is missing.
	it( 'surfaces an error when an editable binding has no setValues', () => {
		const consoleError = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			// No setValues, but editable.
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );
		markContainerControlled( clientId );

		act( () => {
			result.current.onChange(
				[ createBlock( 'core/paragraph', { content: 'X' } ) ],
				{}
			);
		} );

		expect( consoleError ).toHaveBeenCalled();
		consoleError.mockRestore();
	} );

	// Write-back failure surfaces when setValues throws.
	it( 'surfaces an error when setValues throws and does not swallow it', () => {
		const consoleError = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );
		const setValues = jest.fn( () => {
			throw new Error( 'boom' );
		} );
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );
		markContainerControlled( clientId );

		act( () => {
			result.current.onChange(
				[ createBlock( 'core/paragraph', { content: 'X' } ) ],
				{}
			);
		} );

		expect( setValues ).toHaveBeenCalled();
		expect( consoleError ).toHaveBeenCalled();
		consoleError.mockRestore();
	} );

	// The read-only gate receives the binding's args, matching the
	// established source signature used by attribute bindings, so
	// args-dependent sources (e.g. core/post-meta) can gate per-field.
	it( 'passes the binding args to canUserEditValue', () => {
		const canUserEditValue = jest.fn( () => true );
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues: jest.fn(),
			canUserEditValue,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: {
					source: 'core/test-source',
					args: { key: 'hero' },
				},
			},
		} );

		renderBoundHook( clientId );

		expect( canUserEditValue ).toHaveBeenCalledWith(
			expect.objectContaining( {
				args: { key: 'hero' },
				clientId,
				attributeName: 'innerBlocks',
			} )
		);
	} );

	// Read-only enforcement: templateLock does not prevent editing child
	// content, so the resolver additionally disables the editing mode of every
	// block in the bound subtree (rendering the child wrappers inert).
	it( 'disables the editing mode of the bound subtree when read-only, and re-enables it on unmount', async () => {
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues: jest.fn(),
			canUserEditValue: () => false,
		} );
		const container = createBlock(
			'core/test-container',
			{
				metadata: {
					bindings: {
						innerBlocks: { source: 'core/test-source', args: {} },
					},
				},
			},
			[
				createBlock( 'core/paragraph', { content: 'Locked child' }, [
					// A grandchild proves the whole subtree is disabled, not
					// just the direct children.
					createBlock( 'core/paragraph', { content: 'Nested' } ),
				] ),
			]
		);
		act( () => {
			dispatch( blockEditorStore ).resetBlocks( [ container ] );
		} );
		const [ childId ] = globalSelect( blockEditorStore ).getBlockOrder(
			container.clientId
		);
		const [ grandChildId ] =
			globalSelect( blockEditorStore ).getBlockOrder( childId );

		const view = renderBoundHook( container.clientId );

		expect(
			globalSelect( blockEditorStore ).getBlockEditingMode( childId )
		).toBe( 'disabled' );
		expect(
			globalSelect( blockEditorStore ).getBlockEditingMode( grandChildId )
		).toBe( 'disabled' );

		// Releasing the binding releases the lock.
		await act( async () => {
			view.unmount();
		} );
		expect(
			globalSelect( blockEditorStore ).getBlockEditingMode( childId )
		).toBe( 'default' );
	} );

	// Recursion guard: a binding whose (source, args) already appears in the
	// bound ancestry resolves as absence instead of recursing.
	it( 'resolves as absence when the same (source, args) binding appears in the bound ancestry', () => {
		const consoleError = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );
		const getValues = jest.fn( () => ( {
			innerBlocks: PARAGRAPH_MARKUP,
		} ) );
		registerSource( 'core/test-source', { getValues } );
		const binding = { source: 'core/test-source', args: { key: 'hero' } };
		const clientId = setupBlock( { bindings: { innerBlocks: binding } } );

		const wrapper = ( { children } ) => (
			<boundInnerBlocksAncestry.Provider
				value={ [ getInnerBlocksBindingKey( binding ) ] }
			>
				{ children }
			</boundInnerBlocksAncestry.Provider>
		);

		const { result } = renderBoundHook( clientId, { wrapper } );

		expect( result.current ).toBeUndefined();
		expect( getValues ).not.toHaveBeenCalled();
		expect( consoleError ).toHaveBeenCalled();
		consoleError.mockRestore();
	} );

	// The same source with different args is composition, not recursion.
	it( 'still resolves when an ancestor uses the same source with different args', () => {
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: {
					source: 'core/test-source',
					args: { key: 'inner' },
				},
			},
		} );

		const wrapper = ( { children } ) => (
			<boundInnerBlocksAncestry.Provider
				value={ [
					getInnerBlocksBindingKey( {
						source: 'core/test-source',
						args: { key: 'outer' },
					} ),
				] }
			>
				{ children }
			</boundInnerBlocksAncestry.Provider>
		);

		const { result } = renderBoundHook( clientId, { wrapper } );

		expect( result.current ).toBeDefined();
		expect( result.current.value ).toHaveLength( 1 );
	} );

	// The guard key is context-aware: the same source and args resolving
	// under different values of the context the source declares it consumes
	// is composition (e.g. per-post areas nested through a provider), not
	// recursion.
	it( 'still resolves when an ancestor used the same source and args under different source-used context', () => {
		registerSource( 'core/test-source', {
			usesContext: [ 'test/source-context' ],
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
		} );
		const binding = { source: 'core/test-source', args: {} };
		const clientId = setupBlock( { bindings: { innerBlocks: binding } } );

		const wrapper = ( { children } ) => (
			<BlockContextProvider value={ { 'test/source-context': 'inner' } }>
				<boundInnerBlocksAncestry.Provider
					value={ [
						getInnerBlocksBindingKey( binding, {
							'test/source-context': 'outer',
						} ),
					] }
				>
					{ children }
				</boundInnerBlocksAncestry.Provider>
			</BlockContextProvider>
		);

		const { result } = renderBoundHook( clientId, { wrapper } );

		expect( result.current ).toBeDefined();
		expect( result.current.value ).toHaveLength( 1 );
	} );

	// A nested binding matching an ancestor on source, args AND the resolved
	// source-used context values is a true cycle and resolves as absence.
	it( 'resolves as absence when the same source, args and source-used context appear in the ancestry', () => {
		const consoleError = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );
		const getValues = jest.fn( () => ( {
			innerBlocks: PARAGRAPH_MARKUP,
		} ) );
		registerSource( 'core/test-source', {
			usesContext: [ 'test/source-context' ],
			getValues,
		} );
		const binding = { source: 'core/test-source', args: {} };
		const clientId = setupBlock( { bindings: { innerBlocks: binding } } );

		const wrapper = ( { children } ) => (
			<BlockContextProvider value={ { 'test/source-context': 'same' } }>
				<boundInnerBlocksAncestry.Provider
					value={ [
						getInnerBlocksBindingKey( binding, {
							'test/source-context': 'same',
						} ),
					] }
				>
					{ children }
				</boundInnerBlocksAncestry.Provider>
			</BlockContextProvider>
		);

		const { result } = renderBoundHook( clientId, { wrapper } );

		expect( result.current ).toBeUndefined();
		expect( getValues ).not.toHaveBeenCalled();
		expect( consoleError ).toHaveBeenCalled();
		consoleError.mockRestore();
	} );

	// `useInnerBlocksBindingKey` produces the same context-aware key the
	// resolver checks against, so bound containers push a matching entry
	// onto the ancestry.
	it( 'useInnerBlocksBindingKey returns the context-aware guard key', () => {
		registerSource( 'core/test-source', {
			usesContext: [ 'test/source-context' ],
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
		} );
		const binding = { source: 'core/test-source', args: { key: 'hero' } };

		const wrapper = ( { children } ) => (
			<BlockContextProvider
				value={ {
					'test/source-context': 'from-provider',
					'test/unrelated-context': 'ignored',
				} }
			>
				{ children }
			</BlockContextProvider>
		);

		const view = renderHook( () => useInnerBlocksBindingKey( binding ), {
			wrapper,
		} );
		mountedHooks.push( view );

		expect( view.result.current ).toBe(
			getInnerBlocksBindingKey( binding, {
				'test/source-context': 'from-provider',
			} )
		);
		// Only the source-declared context enters the key.
		expect( view.result.current ).not.toContain( 'ignored' );
	} );

	it( 'useInnerBlocksBindingKey returns undefined for an unregistered source', () => {
		const view = renderHook( () =>
			useInnerBlocksBindingKey( {
				source: 'core/unknown-source',
				args: {},
			} )
		);
		mountedHooks.push( view );

		expect( view.result.current ).toBeUndefined();
	} );

	// Releasing control (binding removed, or the source flipping to absence)
	// must keep the content the container held at the release: the resolver
	// captures the store children in the layout phase of the release commit
	// and re-seeds them if the departing sync engine's teardown emptied the
	// container. These unit tests pin the hook's contract against the store
	// state; the "integration with useBlockSync" suite exercises the real
	// engine's teardown ordering.
	it( 'keeps the bound content when the source flips to absence', () => {
		// The source reads its value from the binding args so the test can
		// flip it to absence through a real store update.
		registerSource( 'core/test-source', {
			getValues: ( { bindings } ) => ( {
				innerBlocks: bindings.innerBlocks.args?.stored,
			} ),
			setValues: jest.fn(),
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: {
					source: 'core/test-source',
					args: { stored: PARAGRAPH_MARKUP },
				},
			},
		} );

		const { result } = renderBoundHook( clientId );
		expect( result.current.value ).toHaveLength( 1 );
		markContainerControlled( clientId, result.current.value );

		// Flip the source to absence. The harness mounts no sync engine, so
		// no teardown empties the container; the captured children stay put
		// and no re-seed is dispatched.
		act( () => {
			const metadata =
				globalSelect( blockEditorStore ).getBlockAttributes(
					clientId
				).metadata;
			dispatch( blockEditorStore ).updateBlockAttributes( clientId, {
				metadata: {
					...metadata,
					bindings: {
						...metadata.bindings,
						innerBlocks: {
							...metadata.bindings.innerBlocks,
							args: {},
						},
					},
				},
			} );
		} );

		expect( result.current ).toBeUndefined();
		const restored = globalSelect( blockEditorStore ).getBlocks( clientId );
		expect( restored ).toHaveLength( 1 );
		expect( restored[ 0 ].name ).toBe( 'core/paragraph' );
		expect( restored[ 0 ].attributes.content ).toBe( 'Bound paragraph' );
	} );

	it( 'keeps the bound content when the binding is deliberately removed', () => {
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues: jest.fn(),
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );
		expect( result.current.value ).toHaveLength( 1 );
		markContainerControlled( clientId, result.current.value );

		// Detach: remove the binding from the block's attributes.
		act( () => {
			dispatch( blockEditorStore ).updateBlockAttributes( clientId, {
				metadata: {},
			} );
		} );

		expect( result.current ).toBeUndefined();
		const restored = globalSelect( blockEditorStore ).getBlocks( clientId );
		expect( restored ).toHaveLength( 1 );
		expect( restored[ 0 ].attributes.content ).toBe( 'Bound paragraph' );
	} );

	// Undo of "add binding": the entity reverts to "no binding + own
	// children" through a reset that re-takes ownership of the container.
	// The store-level contract this test mirrors (see `withBlockReset`) is
	// that such a reset clears the controlled flag and applies the entity's
	// children; the resolver must leave those children alone rather than
	// clobber them with the last controlled tree.
	it( 'leaves entity-restored children alone when the binding is released by an external reset', () => {
		const setValues = jest.fn();
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues,
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );
		expect( result.current.value ).toHaveLength( 1 );

		// Mirror the production sync engine: mark controlled and seed the
		// store with the bound tree.
		markContainerControlled( clientId, result.current.value );

		// Entity-driven reset (undo): the incoming container carries its own
		// restored children and no binding, so `withBlockReset` releases the
		// preserved controller — the flag is dropped and the incoming
		// children are applied. This is the exact production dispatch; no
		// manual flag handling.
		act( () => {
			dispatch( blockEditorStore ).resetBlocks( [
				{
					clientId,
					name: 'core/test-container',
					attributes: {},
					isValid: true,
					innerBlocks: [
						createBlock( 'core/paragraph', {
							content: 'Own child',
						} ),
					],
				},
			] );
		} );

		expect( result.current ).toBeUndefined();
		const children = globalSelect( blockEditorStore ).getBlocks( clientId );
		expect( children ).toHaveLength( 1 );
		expect( children[ 0 ].attributes.content ).toBe( 'Own child' );
		expect( setValues ).not.toHaveBeenCalled();
	} );

	// Same as above with an empty restored tree: a container that had no
	// children before the binding was added must stay empty after the undo —
	// the resolver must not re-seed the bound tree just because the count is
	// zero.
	it( 'does not re-seed the bound tree when an external reset restores an empty container', () => {
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues: jest.fn(),
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );
		expect( result.current.value ).toHaveLength( 1 );
		markContainerControlled( clientId, result.current.value );

		// Undo lands on "empty container, no binding". The incoming block is
		// childless, but removing the binding is itself the release signal
		// `withBlockReset` honors — the empty container must not be re-seeded
		// with the bound tree.
		act( () => {
			dispatch( blockEditorStore ).resetBlocks( [
				{
					clientId,
					name: 'core/test-container',
					attributes: {},
					isValid: true,
					innerBlocks: [],
				},
			] );
		} );

		expect( result.current ).toBeUndefined();
		expect(
			globalSelect( blockEditorStore ).getBlocks( clientId )
		).toHaveLength( 0 );
	} );

	// A non-string value fails loudly rather than silently parsing.
	it( 'surfaces an error and stays uncontrolled for a non-string source value', () => {
		const consoleError = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );
		registerSource( 'core/test-source', {
			getValues: () => ( { innerBlocks: { not: 'a string' } } ),
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: { source: 'core/test-source', args: {} },
			},
		} );

		const { result } = renderBoundHook( clientId );

		expect( consoleError ).toHaveBeenCalled();
		expect( result.current ).toBeUndefined();
		consoleError.mockRestore();
	} );

	// Undo/redo identity: reverting the source to a previously resolved
	// string must return the previously resolved array — same identity, same
	// external clientIds — so the sync engine's selection restoration can map
	// the recorded caret into the re-cloned subtree.
	it( 'resolves a reverted source value to the previously resolved blocks (undo/redo identity)', () => {
		registerSource( 'core/test-source', {
			getValues: ( { bindings } ) => ( {
				innerBlocks: bindings.innerBlocks.args?.stored,
			} ),
			setValues: jest.fn(),
		} );
		const clientId = setupBlock( {
			bindings: {
				innerBlocks: {
					source: 'core/test-source',
					args: { stored: PARAGRAPH_MARKUP },
				},
			},
		} );

		function storeValue( markup ) {
			const metadata =
				globalSelect( blockEditorStore ).getBlockAttributes(
					clientId
				).metadata;
			dispatch( blockEditorStore ).updateBlockAttributes( clientId, {
				metadata: {
					...metadata,
					bindings: {
						...metadata.bindings,
						innerBlocks: {
							...metadata.bindings.innerBlocks,
							args: { stored: markup },
						},
					},
				},
			} );
		}

		const { result } = renderBoundHook( clientId );
		const firstValue = result.current.value;
		expect( firstValue[ 0 ].attributes.content ).toBe( 'Bound paragraph' );

		act( () => {
			storeValue(
				'<!-- wp:paragraph -->\n<p>Changed</p>\n<!-- /wp:paragraph -->'
			);
		} );
		expect( result.current.value ).not.toBe( firstValue );

		// The revert (undo) resolves back to the same array identity.
		act( () => {
			storeValue( PARAGRAPH_MARKUP );
		} );
		expect( result.current.value ).toBe( firstValue );
	} );

	// End-to-end behavior with the real controlled sync engine: the parse
	// cache's identity guarantees are what keep typing from re-cloning the
	// subtree (echo suppression) and what let the caret be restored after an
	// undo/redo re-clone.
	describe( 'integration with useBlockSync', () => {
		function registerStoredSource() {
			// Round-trips writes through the container's binding args, so
			// `getValues` echoes the exact written string on the next read.
			registerSource( 'core/test-source', {
				getValues: ( { bindings } ) => ( {
					innerBlocks: bindings.innerBlocks.args?.stored ?? '',
				} ),
				setValues: ( {
					select,
					dispatch: sourceDispatch,
					clientId: id,
					bindings,
				} ) => {
					const metadata =
						select( blockEditorStore ).getBlockAttributes(
							id
						).metadata;
					sourceDispatch( blockEditorStore ).updateBlockAttributes(
						id,
						{
							metadata: {
								...metadata,
								bindings: {
									...metadata.bindings,
									innerBlocks: {
										...metadata.bindings.innerBlocks,
										args: {
											stored: bindings.innerBlocks
												.newValue,
										},
									},
								},
							},
						}
					);
				},
			} );
		}

		function renderBoundSyncedArea( clientId, selectionRef ) {
			const view = renderHook(
				() => {
					const binding = useSelect(
						( select ) =>
							getInnerBlocksBinding(
								select( blockEditorStore ).getBlockAttributes(
									clientId
								)
							),
						[]
					);
					const props = useBoundInnerBlocksProps( clientId, binding );
					useBlockSync( {
						clientId,
						value: props?.value,
						onChange: props?.onChange,
						onInput: props?.onInput,
					} );
					return props;
				},
				{
					wrapper: ( { children } ) => (
						<SelectionContext.Provider
							value={ {
								getSelection: () => selectionRef.current,
								onChangeSelection: () => {},
							} }
						>
							{ children }
						</SelectionContext.Provider>
					),
				}
			);
			mountedHooks.push( view );
			return view;
		}

		it( 'keeps the store subtree intact while typing (write-back echo suppression)', () => {
			registerStoredSource();
			const clientId = setupBlock( {
				bindings: {
					innerBlocks: {
						source: 'core/test-source',
						args: { stored: PARAGRAPH_MARKUP },
					},
				},
			} );
			const selectionRef = { current: undefined };

			renderBoundSyncedArea( clientId, selectionRef );

			// The sync engine cloned the value into the store.
			const [ child ] =
				globalSelect( blockEditorStore ).getBlocks( clientId );
			expect( child.name ).toBe( 'core/paragraph' );

			// Type into the cloned child: the subscription reports the change,
			// the write-back stores it, and the echo resolves to the exact
			// outgoing array — no reset, no re-clone.
			act( () => {
				dispatch( blockEditorStore ).updateBlockAttributes(
					child.clientId,
					{ content: 'edited' }
				);
			} );

			const childrenAfterEdit =
				globalSelect( blockEditorStore ).getBlocks( clientId );
			expect( childrenAfterEdit ).toHaveLength( 1 );
			expect( childrenAfterEdit[ 0 ].clientId ).toBe( child.clientId );
			expect( childrenAfterEdit[ 0 ].attributes.content ).toBe(
				'edited'
			);
		} );

		it( 'restores the caret into the re-cloned subtree when the source reverts (undo)', () => {
			registerStoredSource();
			const clientId = setupBlock( {
				bindings: {
					innerBlocks: {
						source: 'core/test-source',
						args: { stored: PARAGRAPH_MARKUP },
					},
				},
			} );
			const selectionRef = { current: undefined };

			const { result } = renderBoundSyncedArea( clientId, selectionRef );

			const initialValue = result.current.value;
			// External (value-side) id of the paragraph; stable across the
			// edit because the sync engine restores external ids on outgoing
			// changes.
			const externalId = initialValue[ 0 ].clientId;
			const internalBefore =
				globalSelect( blockEditorStore ).getBlocks( clientId )[ 0 ]
					.clientId;
			expect( internalBefore ).not.toBe( externalId );

			// Edit, then record a caret position against the external id, the
			// way the entity records selection.
			act( () => {
				dispatch( blockEditorStore ).updateBlockAttributes(
					internalBefore,
					{ content: 'edited' }
				);
			} );
			selectionRef.current = {
				selectionStart: {
					clientId: externalId,
					attributeKey: 'content',
					offset: 3,
				},
				selectionEnd: {
					clientId: externalId,
					attributeKey: 'content',
					offset: 3,
				},
			};

			// Revert the source to the original markup (undo). The cached
			// identity brings back the original external ids, so the freshly
			// rebuilt id mapping still contains the recorded caret's id.
			act( () => {
				const metadata =
					globalSelect( blockEditorStore ).getBlockAttributes(
						clientId
					).metadata;
				dispatch( blockEditorStore ).updateBlockAttributes( clientId, {
					metadata: {
						...metadata,
						bindings: {
							...metadata.bindings,
							innerBlocks: {
								...metadata.bindings.innerBlocks,
								args: { stored: PARAGRAPH_MARKUP },
							},
						},
					},
				} );
			} );

			// The cache returns the identical value array…
			expect( result.current.value ).toBe( initialValue );

			// …the sync engine still re-clones the store subtree (its
			// contract for every non-echo incoming value)…
			const [ childAfterRevert ] =
				globalSelect( blockEditorStore ).getBlocks( clientId );
			expect( childAfterRevert.clientId ).not.toBe( internalBefore );
			expect( childAfterRevert.attributes.content ).toBe(
				'Bound paragraph'
			);

			// …and the caret recorded against the external id is restored
			// inside the re-cloned subtree.
			expect(
				globalSelect( blockEditorStore ).getSelectionStart()
			).toEqual( {
				clientId: childAfterRevert.clientId,
				attributeKey: 'content',
				offset: 3,
			} );
		} );

		// Production-shaped harness: like `BoundInnerBlocks`, the sync engine
		// lives in a child component that only mounts while the binding
		// resolves, so releasing the binding unmounts it and runs its real
		// teardown (clear the controlled flag, empty the container) in the
		// passive phase of the release commit.
		function ControlledSync( props ) {
			useBlockSync( props );
			return null;
		}

		function mountProductionBoundArea( clientId ) {
			const resultRef = { current: undefined };
			function BoundArea() {
				const binding = useSelect(
					( select ) =>
						getInnerBlocksBinding(
							select( blockEditorStore ).getBlockAttributes(
								clientId
							)
						),
					[]
				);
				const props = useBoundInnerBlocksProps( clientId, binding );
				resultRef.current = props;
				return props ? (
					<ControlledSync
						clientId={ clientId }
						value={ props.value }
						onChange={ props.onChange }
						onInput={ props.onInput }
					/>
				) : null;
			}
			const view = render(
				<SelectionContext.Provider
					value={ {
						getSelection: () => undefined,
						onChangeSelection: () => {},
					} }
				>
					<BoundArea />
				</SelectionContext.Provider>
			);
			mountedHooks.push( view );
			return resultRef;
		}

		// Deliberate detach with the real engine: the unmounting sync
		// engine's teardown empties the container; the resolver's release
		// capture re-seeds the blocks the user was looking at.
		it( 'keeps the bound content when the binding is detached (real teardown)', () => {
			registerSource( 'core/test-source', {
				getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
				setValues: jest.fn(),
			} );
			const clientId = setupBlock( {
				bindings: {
					innerBlocks: { source: 'core/test-source', args: {} },
				},
			} );

			const resultRef = mountProductionBoundArea( clientId );

			// The sync engine cloned the bound value into the store and
			// flagged the container.
			const [ child ] =
				globalSelect( blockEditorStore ).getBlocks( clientId );
			expect( child.name ).toBe( 'core/paragraph' );
			expect(
				globalSelect( blockEditorStore ).areInnerBlocksControlled(
					clientId
				)
			).toBe( true );

			// Detach: remove the binding. The sync engine unmounts and its
			// teardown wipes the container; the release capture re-seeds it.
			act( () => {
				dispatch( blockEditorStore ).updateBlockAttributes( clientId, {
					metadata: {},
				} );
			} );

			expect( resultRef.current ).toBeUndefined();
			expect(
				globalSelect( blockEditorStore ).areInnerBlocksControlled(
					clientId
				)
			).toBe( false );
			const restored =
				globalSelect( blockEditorStore ).getBlocks( clientId );
			expect( restored ).toHaveLength( 1 );
			expect( restored[ 0 ].attributes.content ).toBe(
				'Bound paragraph'
			);
		} );

		// Entity-driven release with production ordering: a root-controller
		// reset (marked not persistent, no manual flag handling) removes the
		// binding. `withBlockReset` releases the preserved controller and
		// applies the entity's children; the resolver must neither write the
		// released children back to the source nor clobber them with the
		// bound tree.
		it( 'does not write back to the source and keeps content when an external reset releases the binding', () => {
			const setValues = jest.fn();
			registerSource( 'core/test-source', {
				getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
				setValues,
			} );
			const clientId = setupBlock( {
				bindings: {
					innerBlocks: { source: 'core/test-source', args: {} },
				},
			} );

			const resultRef = mountProductionBoundArea( clientId );
			expect(
				globalSelect( blockEditorStore ).getBlocks( clientId )
			).toHaveLength( 1 );

			// Undo at the root controller: the entity reverts to "no binding
			// + own children" — exactly the dispatch `useBlockSync`'s root
			// branch performs. No manual flag manipulation: production code
			// never clears the flag before the reset.
			const container = createBlock( 'core/test-container', {}, [
				createBlock( 'core/paragraph', { content: 'Own child' } ),
			] );
			container.clientId = clientId;
			act( () => {
				dispatch(
					blockEditorStore
				).__unstableMarkNextChangeAsNotPersistent();
				dispatch( blockEditorStore ).resetBlocks( [ container ] );
			} );

			// The binding is released…
			expect( resultRef.current ).toBeUndefined();
			// …the source value is never clobbered with the released
			// children…
			expect( setValues ).not.toHaveBeenCalled();
			// …and the container holds the entity's restored children — not
			// the bound tree, and not the emptiness left by the departing
			// sync engine's teardown.
			const children =
				globalSelect( blockEditorStore ).getBlocks( clientId );
			expect( children ).toHaveLength( 1 );
			expect( children[ 0 ].attributes.content ).toBe( 'Own child' );
		} );
	} );
} );
