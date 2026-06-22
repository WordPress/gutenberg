/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { parse, serialize, store as blocksStore } from '@wordpress/blocks';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockContext from '../block-context';
import {
	getBlockBindingsContext,
	getInnerBlocksBinding,
	INNER_BLOCKS_BINDING_KEY,
} from '../../utils/block-bindings';
import { unlock } from '../../lock-unlock';

export { getInnerBlocksBinding };

const EMPTY_ARRAY = [];
const EMPTY_CONTEXT = {};
const EMPTY_RESOLUTION = { serialized: undefined, isReadOnly: false };
const INVALID_VALUE = {};

/**
 * Bounds the per-binding parse cache. The controlled sync engine re-clones
 * every non-echo incoming value into fresh internal clientIds, so the cache
 * cannot prevent remounts of the bound subtree; what it preserves is the
 * identity — and with it the external clientIds — of a previously resolved
 * value array. That (a) lets a write-back's echo resolve to the exact array
 * reference the sync engine queued as outgoing, short-circuiting a
 * reset/re-clone on every keystroke, and (b) makes undo/redo revert to a
 * value whose external clientIds still key the sync engine's selection
 * restoration, so the caret is re-placed inside the re-cloned subtree. Past
 * this size, older values re-parse: content stays correct, but selection
 * restoration is skipped for that history step.
 */
const MAX_PARSE_CACHE_SIZE = 20;

/**
 * Hard ceiling for nested bound areas. A cycle between two or more sources
 * whose args change on every level defeats the exact-key recursion check;
 * the depth cap guarantees termination regardless.
 */
const MAX_BOUND_DEPTH = 32;

/**
 * Inserts a parsed tree into the cache as its newest entry — so a just-written
 * value can never be the eviction victim before its echo arrives — and evicts
 * the oldest entries beyond {@link MAX_PARSE_CACHE_SIZE}.
 *
 * @param {Object}   parseCache The parse cache record holding the entries Map.
 * @param {string}   serialized The serialized string keying the entry.
 * @param {Object[]} blocks     The parsed blocks to cache.
 */
function cacheParsedValue( parseCache, serialized, blocks ) {
	const { entries } = parseCache;
	entries.delete( serialized );
	entries.set( serialized, blocks );
	while ( entries.size > MAX_PARSE_CACHE_SIZE ) {
		entries.delete( entries.keys().next().value );
	}
}

/**
 * Tracks the chain of guard keys of the bound areas above the current block,
 * so a source that supplies markup containing a block bound to the same
 * source (directly or through a cycle) is detected and resolved as absence
 * instead of recursing without bound.
 */
export const boundInnerBlocksAncestry = createContext( EMPTY_ARRAY );

function sortKeys( object ) {
	const sorted = {};
	for ( const key of Object.keys( object ).sort() ) {
		sorted[ key ] = object[ key ];
	}
	return sorted;
}

/**
 * Returns the recursion-guard key identifying a binding: the source name, its
 * serialized args, and the resolved values of the context the source declares
 * it consumes (its `usesContext`). Nested blocks bound to the same source form
 * a cycle only when all three match — the same source resolving under
 * different args or different source-used context values is composition, not
 * recursion. Mirrors the guard-key semantics of the PHP renderer.
 *
 * @param {Object|undefined} binding       The inner-blocks binding descriptor.
 * @param {Object}           sourceContext The subset of the block's context
 *                                         the source declares it consumes.
 *
 * @return {string|undefined} The guard key, or undefined without a binding.
 */
export function getInnerBlocksBindingKey(
	binding,
	sourceContext = EMPTY_CONTEXT
) {
	if ( typeof binding?.source !== 'string' || binding.source === '' ) {
		return undefined;
	}
	return `${ binding.source }|${ JSON.stringify(
		sortKeys( binding.args ?? {} )
	) }|${ JSON.stringify( sortKeys( sourceContext ) ) }`;
}

/**
 * Returns the subset of the block's resolved context that the binding source
 * declares it consumes — the context part of the recursion-guard key. A
 * source without `usesContext` is context-independent by declaration, so its
 * key carries no context.
 *
 * @param {Object|undefined} source       The registered bindings source.
 * @param {Object}           blockContext The block's resolved context.
 *
 * @return {Object} The source-used context subset.
 */
function getBindingGuardContext( source, blockContext ) {
	const guardContext = {};
	source?.usesContext?.forEach( ( key ) => {
		if ( blockContext[ key ] !== undefined ) {
			guardContext[ key ] = blockContext[ key ];
		}
	} );
	return guardContext;
}

/**
 * Returns the context-aware recursion-guard key for a block's `innerBlocks`
 * binding, or `undefined` when the binding is absent or its source is not
 * registered. Bound containers push this key onto the ancestry consumed by
 * nested bindings, so it must be derived from the same inputs
 * {@link useBoundInnerBlocksProps} checks against.
 *
 * @param {Object|undefined} binding The inner-blocks binding descriptor.
 *
 * @return {string|undefined} The guard key.
 */
export function useInnerBlocksBindingKey( binding ) {
	const blockContext = useContext( BlockContext );
	const sourceName =
		typeof binding?.source === 'string' && binding.source !== ''
			? binding.source
			: undefined;
	const source = useSelect(
		( select ) =>
			sourceName
				? unlock( select( blocksStore ) ).getBlockBindingsSource(
						sourceName
				  )
				: undefined,
		[ sourceName ]
	);

	return useMemo( () => {
		if ( ! source ) {
			return undefined;
		}
		return getInnerBlocksBindingKey(
			binding,
			getBindingGuardContext( source, blockContext )
		);
	}, [ source, binding, blockContext ] );
}

/**
 * Resolves controlled inner-block props from an `innerBlocks` binding source.
 *
 * Source values use the serialized block-markup contract: `undefined`/`null`
 * means fallback to the block's own children, `''` means an intentionally empty
 * area, and any other string is parsed into controlled blocks.
 *
 * The hook also owns three lifecycle guarantees of the bound area:
 *
 * - **Release keeps content**: when the area stops being controlled (the
 *   binding was removed, the source flipped to absence, or an undo/redo
 *   reset released it), the controlled sync engine empties the container on
 *   teardown; this hook captures whatever children the container holds at
 *   the release commit — the bound blocks on a deliberate detach, the
 *   entity's restored children after an undo reset — and re-seeds them if
 *   the container was emptied, so releasing a binding never destroys
 *   content and never clobbers an undo.
 * - **Read-only is enforced**: a source whose `canUserEditValue` returns
 *   `false` gets its subtree's editing mode set to `disabled` (rendering the
 *   child wrappers inert), on top of `templateLock`/appender removal.
 * - **Recursion terminates**: a binding whose (source, args, source-used
 *   context) already appears in the bound ancestry — or nested beyond
 *   {@link MAX_BOUND_DEPTH} — is resolved as absence.
 *
 * @param {string}           clientId  The block client ID.
 * @param {Object|undefined} binding   The inner-blocks binding descriptor.
 * @param {Object}           blockType Optional pre-resolved block type.
 *
 * @return {Object|undefined} Controlled inner-block props, or undefined.
 */
export function useBoundInnerBlocksProps( clientId, binding, blockType ) {
	const registry = useRegistry();
	const blockContext = useContext( BlockContext );
	const ancestry = useContext( boundInnerBlocksAncestry );
	// Parsed trees keyed by serialized string, so re-resolving a previously
	// seen value (echo after write-back, undo/redo) returns the same array
	// identity — and thus the same external clientIds — instead of freshly
	// parsed clientIds. See MAX_PARSE_CACHE_SIZE for what that preserves.
	const parseCacheRef = useRef( {
		sourceName: undefined,
		entries: new Map(),
	} );
	// The serialized string last applied (from the source or a write-back);
	// transient writes that re-serialize to it are dropped as echoes.
	const lastSerializedRef = useRef( undefined );
	const didWarnRecursionRef = useRef( false );

	const sourceName =
		typeof binding?.source === 'string' && binding.source !== ''
			? binding.source
			: undefined;
	const args = sourceName ? binding?.args : undefined;

	const source = useSelect(
		( select ) => {
			if ( ! sourceName ) {
				return undefined;
			}

			return unlock( select( blocksStore ) ).getBlockBindingsSource(
				sourceName
			);
		},
		[ sourceName ]
	);

	const guardContext = useMemo(
		() => getBindingGuardContext( source, blockContext ),
		[ source, blockContext ]
	);
	const recursionKey = source
		? getInnerBlocksBindingKey( binding, guardContext )
		: undefined;
	const isRecursive =
		!! recursionKey &&
		( ancestry.includes( recursionKey ) ||
			ancestry.length >= MAX_BOUND_DEPTH );
	useEffect( () => {
		if ( isRecursive && ! didWarnRecursionRef.current ) {
			didWarnRecursionRef.current = true;
			// eslint-disable-next-line no-console
			console.error(
				`The "innerBlocks" binding source "${ sourceName }" supplies a block bound to itself; the nested binding resolves as absence to prevent infinite recursion.`
			);
		}
	}, [ isRecursive, sourceName ] );

	const resolvedBlockType = useSelect(
		( select ) => {
			if ( blockType || ! clientId ) {
				return blockType;
			}

			const blockName =
				select( blockEditorStore ).getBlockName( clientId );
			return blockName
				? select( blocksStore ).getBlockType( blockName )
				: undefined;
		},
		[ blockType, clientId ]
	);

	const context = useMemo(
		() =>
			getBlockBindingsContext(
				blockContext,
				resolvedBlockType?.usesContext,
				[ source ]
			),
		[ source, blockContext, resolvedBlockType ]
	);

	const { serialized, isReadOnly } = useSelect(
		( select ) => {
			if ( isRecursive || ! source?.getValues ) {
				return EMPTY_RESOLUTION;
			}

			const values = source.getValues( {
				select,
				context,
				clientId,
				bindings: { [ INNER_BLOCKS_BINDING_KEY ]: { args } },
			} );
			const rawValue = values?.[ INNER_BLOCKS_BINDING_KEY ];
			const nextSerialized = rawValue === null ? undefined : rawValue;
			const serializedValue =
				nextSerialized !== undefined &&
				typeof nextSerialized !== 'string'
					? INVALID_VALUE
					: nextSerialized;

			return {
				serialized: serializedValue,
				isReadOnly:
					serializedValue !== undefined &&
					serializedValue !== INVALID_VALUE &&
					source.canUserEditValue?.( {
						select,
						context,
						args,
						clientId,
						attributeName: INNER_BLOCKS_BINDING_KEY,
					} ) === false,
			};
		},
		[ isRecursive, source, context, clientId, args ]
	);

	const value = useMemo( () => {
		if ( serialized === undefined ) {
			return undefined;
		}

		if ( serialized === INVALID_VALUE ) {
			// eslint-disable-next-line no-console
			console.error(
				`The "innerBlocks" binding source "${ sourceName }" returned a non-string value. The value must be a serialized block-markup string.`
			);
			return undefined;
		}

		const parseCache = parseCacheRef.current;
		if ( parseCache.sourceName !== sourceName ) {
			parseCache.sourceName = sourceName;
			parseCache.entries.clear();
		}

		let blocks = parseCache.entries.get( serialized );
		if ( ! blocks ) {
			blocks = serialized === '' ? [] : parse( serialized );
		}
		cacheParsedValue( parseCache, serialized, blocks );

		lastSerializedRef.current = serialized;
		return blocks;
	}, [ serialized, sourceName ] );

	const writeBack = useCallback(
		( blocks, persistent ) => {
			if ( isReadOnly ) {
				return;
			}

			// An entity-driven reset (undo/redo) can re-take ownership of the
			// container in the same tick it removes the binding; the still-
			// subscribed controlled sync engine then reports the restored
			// children as an outgoing edit before React re-renders. Writing
			// that back would clobber the source value with the entity's own
			// children, so a write for a container the sync engine no longer
			// owns is dropped. While a binding is applied, the sync engine
			// flags the container before its first subscriber run.
			if (
				clientId &&
				! registry
					.select( blockEditorStore )
					.areInnerBlocksControlled( clientId )
			) {
				return;
			}

			if ( ! source?.setValues ) {
				// eslint-disable-next-line no-console
				console.error(
					`The "innerBlocks" binding source "${ sourceName }" is editable but does not implement "setValues"; the edit could not be persisted.`
				);
				return;
			}

			const newValue = serialize( blocks );
			if ( ! persistent && newValue === lastSerializedRef.current ) {
				return;
			}

			lastSerializedRef.current = newValue;
			cacheParsedValue( parseCacheRef.current, newValue, blocks );
			registry.batch( () => {
				try {
					// The non-persistent mark taints whichever action next
					// reaches the block-editor reducer. A source persisting
					// outside the block-editor store (e.g. a core-data
					// entity) never consumes it, so arming it up front would
					// leak onto the user's next unrelated edit, recording it
					// as non-persistent. Arm it lazily instead, only when the
					// source asks to dispatch to the block-editor store.
					const blockEditorDispatch =
						registry.dispatch( blockEditorStore );
					const sourceDispatch = persistent
						? registry.dispatch
						: ( storeNameOrDescriptor ) => {
								const actions = registry.dispatch(
									storeNameOrDescriptor
								);
								if ( actions === blockEditorDispatch ) {
									blockEditorDispatch.__unstableMarkNextChangeAsNotPersistent();
								}
								return actions;
						  };
					source.setValues( {
						select: registry.select,
						dispatch: sourceDispatch,
						context,
						clientId,
						bindings: {
							[ INNER_BLOCKS_BINDING_KEY ]: {
								args,
								newValue,
							},
						},
					} );
				} catch ( error ) {
					// eslint-disable-next-line no-console
					console.error(
						`The "innerBlocks" binding source "${ sourceName }" failed to persist the edit.`,
						error
					);
				}
			} );
		},
		[ isReadOnly, source, sourceName, registry, context, clientId, args ]
	);

	const onChange = useCallback(
		( blocks ) => writeBack( blocks, true ),
		[ writeBack ]
	);
	const onInput = useCallback(
		( blocks ) => writeBack( blocks, false ),
		[ writeBack ]
	);

	const boundProps = useMemo( () => {
		if ( ! source || value === undefined ) {
			return undefined;
		}

		const props = { value, onChange, onInput };
		if ( isReadOnly ) {
			props.templateLock = 'all';
			props.renderAppender = false;
		}
		return props;
	}, [ source, value, onChange, onInput, isReadOnly ] );

	// Read-only enforcement. `templateLock: 'all'` only removes structural
	// controls (appender, movers, delete); child content stays editable while
	// writeBack drops the edit — silent data loss. Setting the editing mode of
	// every block in the bound subtree to `disabled` renders the child
	// wrappers inert, so a read-only area cannot be edited at all.
	const readOnlyClientIds = useSelect(
		( select ) => {
			if ( ! isReadOnly || ! clientId ) {
				return EMPTY_ARRAY;
			}
			return select( blockEditorStore ).getClientIdsOfDescendants(
				clientId
			);
		},
		[ isReadOnly, clientId ]
	);
	useEffect( () => {
		if ( ! readOnlyClientIds.length ) {
			return;
		}
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );
		registry.batch( () => {
			readOnlyClientIds.forEach( ( id ) =>
				setBlockEditingMode( id, 'disabled' )
			);
		} );
		return () => {
			registry.batch( () => {
				readOnlyClientIds.forEach( ( id ) =>
					unsetBlockEditingMode( id )
				);
			} );
		};
	}, [ readOnlyClientIds, registry ] );

	// Release keeps content. When control is released, the controlled sync
	// engine's teardown empties the container (its passive cleanup runs
	// after the layout effects of the release commit, but before this hook's
	// passive effect). Whatever the container held at the release commit is
	// what the user must keep seeing:
	//
	// - Deliberate detach / source flipped to absence: the store still holds
	//   the bound blocks, so capturing and re-seeding them turns "release"
	//   into "keep the content, drop the binding".
	// - Entity-driven release (an undo/redo reset re-took ownership of the
	//   container and applied its own children): the capture holds the
	//   entity's restored children, so if the departing sync engine wipes
	//   them they are re-seeded; if the store kept them (the container ends
	//   up non-empty), nothing is dispatched.
	//
	// Capturing the store children — instead of the last resolved source
	// tree — is what makes an undo of "add binding" land on the entity's
	// restored children rather than on the bound tree.
	const wasControlledRef = useRef( false );
	const wasControlledLayoutRef = useRef( false );
	const releasedBlocksRef = useRef( EMPTY_ARRAY );
	useLayoutEffect( () => {
		const isControlled = boundProps !== undefined;
		if ( wasControlledLayoutRef.current && ! isControlled && clientId ) {
			// Layout phase of the release commit: the sync engine's teardown
			// has not run yet, so this reads the pre-teardown children.
			releasedBlocksRef.current = registry
				.select( blockEditorStore )
				.getBlocks( clientId );
		}
		wasControlledLayoutRef.current = isControlled;
	} );
	useEffect( () => {
		const isControlled = boundProps !== undefined;
		if ( wasControlledRef.current && ! isControlled && clientId ) {
			const restoreBlocks = releasedBlocksRef.current;
			releasedBlocksRef.current = EMPTY_ARRAY;
			const { getBlockCount } = registry.select( blockEditorStore );
			if ( restoreBlocks.length && getBlockCount( clientId ) === 0 ) {
				const {
					replaceInnerBlocks,
					__unstableMarkNextChangeAsNotPersistent,
				} = registry.dispatch( blockEditorStore );
				// Not persistent: the restore belongs to the same user action
				// (the binding removal or the undo) rather than forming its
				// own undo level.
				__unstableMarkNextChangeAsNotPersistent();
				replaceInnerBlocks( clientId, restoreBlocks );
			}
		}
		wasControlledRef.current = isControlled;
	} );

	return boundProps;
}
