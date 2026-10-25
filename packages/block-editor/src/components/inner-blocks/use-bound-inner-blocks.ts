import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from '@wordpress/element';
import { useRegistry, useSelect } from '@wordpress/data';
import type { SelectFunction } from '@wordpress/data';
import {
	getBlockBindingsSource,
	parse,
	serialize,
	type Block,
} from '@wordpress/blocks';
import BlockContext from '../block-context';
import { store as blockEditorStore } from '../../store';
import {
	INNER_BLOCKS_BINDING_KEY,
	getBlockBindingsContext,
} from '../../utils/block-bindings';

declare global {
	interface Window {
		/**
		 * Whether the Gutenberg experiment that binds inner blocks is enabled.
		 */
		__experimentalInnerBlocksBindings?: boolean;
	}
}

const PATTERN_OVERRIDES_SOURCE = 'core/pattern-overrides';
const BINDINGS = { [ INNER_BLOCKS_BINDING_KEY ]: {} };

/**
 * Returns whether a value supplies inner blocks: block markup, or `''` for no
 * inner blocks. Anything else, like the plain text of a field, leaves the
 * block with its own inner blocks, as on the server.
 *
 * @param value The value of the source.
 *
 * @return Whether the value supplies inner blocks.
 */
function isInnerBlocksValue( value: unknown ): value is string {
	return (
		typeof value === 'string' &&
		( value === '' || /^[ \t\n\f\r]*<!-- wp:/.test( value ) )
	);
}

/**
 * Serializes inner blocks with every block delimited, freeform ones included,
 * so that the markup is a value that supplies them.
 *
 * @param blocks The inner blocks.
 *
 * @return The serialized inner blocks.
 */
function serializeInnerBlocks( blocks: Block[] ) {
	return serialize( blocks, { isInnerBlocks: true } );
}

/**
 * Removes the bindings to a source from blocks and their inner blocks.
 *
 * The blocks a source supplies are its value as a whole, so none of them is
 * bound to it on its own: in a synced pattern, the blocks of an overridden area
 * aren't overridden themselves. This also keeps a value from containing itself.
 *
 * @param blocks     The blocks.
 * @param sourceName The name of the source.
 *
 * @return The blocks, without bindings to the source.
 */
function removeBindings( blocks: Block[], sourceName: string ): Block[] {
	return blocks.map( ( block ) => {
		// Block attributes are untyped; any block may have `metadata`.
		const metadata = block.attributes.metadata as
			{ bindings?: Record< string, { source?: string } > } | undefined;
		const bindings = metadata?.bindings;
		let attributes = block.attributes;
		const otherBindings = Object.entries( bindings ?? {} ).filter(
			( [ , binding ] ) => binding?.source !== sourceName
		);
		if (
			bindings &&
			otherBindings.length < Object.keys( bindings ).length
		) {
			// Drop what's left empty, so the markup is the same as the block's
			// would be without the bindings.
			const { bindings: removed, ...otherMetadata } = metadata;
			const nextMetadata = otherBindings.length
				? {
						...otherMetadata,
						bindings: Object.fromEntries( otherBindings ),
					}
				: otherMetadata;
			attributes = {
				...attributes,
				metadata: Object.keys( nextMetadata ).length
					? nextMetadata
					: undefined,
			};
		}
		return {
			...block,
			attributes,
			innerBlocks: removeBindings( block.innerBlocks, sourceName ),
		};
	} );
}

/**
 * Returns the context of the pattern overrides source for a block: the
 * overrides of the synced pattern instance it's in, read from the store, as
 * the block context only updates once the block renders again.
 *
 * @param select   The registry's select function.
 * @param clientId The block's client ID.
 *
 * @return The context, or `undefined` outside of a synced pattern.
 */
function getPatternOverridesContext(
	select: SelectFunction,
	clientId: string
) {
	const { getBlockAttributes, getBlockParentsByBlockName } =
		select( blockEditorStore );
	const [ patternClientId ] = getBlockParentsByBlockName(
		clientId,
		'core/block',
		true
	);
	return patternClientId
		? {
				'pattern/overrides':
					getBlockAttributes( patternClientId )?.content,
			}
		: undefined;
}

/**
 * Returns how the inner blocks of a block are bound, if they are:
 *
 * - `'editable'`: overridden in a synced pattern instance, which the block can
 *   store its overrides in by its name.
 * - `'preview'`: supplied by any other source, which they're a preview of.
 *
 * Pattern overrides outside of a pattern instance don't bind anything: the
 * block's inner blocks are its own.
 *
 * @param clientId The block's client ID.
 *
 * @return How the block's inner blocks are bound.
 */
export function useInnerBlocksBindingMode(
	clientId: string
): 'editable' | 'preview' | undefined {
	return useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockName, getSettings } =
				select( blockEditorStore );
			const metadata = getBlockAttributes( clientId )?.metadata;
			const supportedAttributes = (
				getSettings().__experimentalBlockBindingsSupportedAttributes as
					Record< string, string[] > | undefined
			 )?.[ getBlockName( clientId ) as string ];
			const sourceName =
				metadata?.bindings?.[ INNER_BLOCKS_BINDING_KEY ]?.source;
			if (
				! supportedAttributes?.includes( INNER_BLOCKS_BINDING_KEY ) ||
				! sourceName ||
				! getBlockBindingsSource( sourceName )
			) {
				return undefined;
			}
			if ( sourceName !== PATTERN_OVERRIDES_SOURCE ) {
				return 'preview';
			}
			return getPatternOverridesContext( select, clientId ) &&
				metadata.name
				? 'editable'
				: undefined;
		},
		[ clientId ]
	);
}

/**
 * Returns the inner blocks a source supplies to a block, to preview them, or
 * `undefined` when it supplies none and the block keeps its own.
 *
 * @param clientId    The block's client ID.
 * @param usesContext The context the block type uses.
 *
 * @return The supplied inner blocks.
 */
export function useInnerBlocksPreview(
	clientId: string,
	usesContext: readonly string[] | undefined
) {
	const blockContext = useContext( BlockContext );
	const { value, sourceName } = useSelect(
		( select ) => {
			const binding =
				select( blockEditorStore ).getBlockAttributes( clientId )
					?.metadata?.bindings?.[ INNER_BLOCKS_BINDING_KEY ];
			const source = getBlockBindingsSource( binding?.source as string );
			return {
				sourceName: binding?.source as string,
				value: source?.getValues?.( {
					select,
					context: getBlockBindingsContext(
						blockContext,
						usesContext,
						[ source ]
					),
					clientId,
					bindings: { [ INNER_BLOCKS_BINDING_KEY ]: binding },
				} )?.[ INNER_BLOCKS_BINDING_KEY ],
			};
		},
		[ clientId, blockContext, usesContext ]
	);
	return useMemo(
		() =>
			isInnerBlocksValue( value )
				? removeBindings( parse( value ), sourceName )
				: undefined,
		[ value, sourceName ]
	);
}

/**
 * Returns the inner blocks of a block in a synced pattern, as overridden in
 * the pattern instance, and how to write them back, for a controller of the
 * block's inner blocks.
 *
 * The override is serialized block markup, where `''` means no inner blocks.
 * Without one, the block shows its own inner blocks, from the pattern.
 *
 * @param clientId The block's client ID.
 *
 * @return The inner blocks and their change handlers.
 */
export function useBoundInnerBlocks( clientId: string ) {
	const registry = useRegistry();
	const source = getBlockBindingsSource( PATTERN_OVERRIDES_SOURCE );

	// Read once, before the inner blocks are controlled and these are gone.
	const [ ownBlocks ] = useState( () =>
		removeBindings(
			registry.select( blockEditorStore ).getBlocks( clientId ),
			PATTERN_OVERRIDES_SOURCE
		)
	);
	// What the inner blocks are in sync with: the source's value, their markup
	// and their blocks. The blocks are returned as they are while the value
	// stays the same, so that it isn't parsed again, and the markup is never
	// written back again: a block reset, as on undo, reports the inner blocks
	// as changed before the source's value reaches them.
	const syncedRef = useRef< {
		value: unknown;
		serialized: string;
		blocks: Block[];
	} | null >( null );

	const getOverride = useCallback(
		( select: SelectFunction ) => {
			const context = getPatternOverridesContext( select, clientId );
			return context
				? source?.getValues?.( {
						select,
						context,
						clientId,
						bindings: BINDINGS,
					} )?.[ INNER_BLOCKS_BINDING_KEY ]
				: undefined;
		},
		[ source, clientId ]
	);
	// Renders again when the value isn't the one the inner blocks are synced
	// with. The store is read directly: `useSelect` can lag a value that is
	// written back and undone in quick succession.
	const [ syncs, sync ] = useReducer( ( count: number ) => count + 1, 0 );
	useEffect( () => {
		const syncIfChanged = () => {
			// A block that left its pattern, as when it's detached, is about
			// to unmount.
			if ( ! getPatternOverridesContext( registry.select, clientId ) ) {
				return;
			}
			if ( getOverride( registry.select ) !== syncedRef.current?.value ) {
				sync();
			}
		};
		// The value may have changed since the render.
		syncIfChanged();
		return registry.subscribe( syncIfChanged, blockEditorStore );
	}, [ registry, getOverride, clientId ] );

	const value = useMemo( () => {
		const override = getOverride( registry.select );
		if ( syncedRef.current && syncedRef.current.value === override ) {
			return syncedRef.current.blocks;
		}
		const blocks = isInnerBlocksValue( override )
			? removeBindings( parse( override ), PATTERN_OVERRIDES_SOURCE )
			: // A new array, so that the inner blocks are reset to it.
				[ ...ownBlocks ];
		syncedRef.current = {
			value: override,
			serialized: isInnerBlocksValue( override )
				? override
				: serializeInnerBlocks( blocks ),
			blocks,
		};
		return blocks;
		// Each sync reads the value again.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ registry, getOverride, ownBlocks, syncs ] );

	const write = useCallback(
		( blocks: Block[], isPersistent: boolean ) => {
			const serialized = serializeInnerBlocks( blocks );
			if ( serialized === syncedRef.current?.serialized ) {
				return;
			}
			syncedRef.current = { value: serialized, serialized, blocks };
			// The source writes to the pattern block, with the persistence of
			// the change to the inner blocks.
			if ( ! isPersistent ) {
				registry
					.dispatch( blockEditorStore )
					.__unstableMarkNextChangeAsNotPersistent();
			}
			source?.setValues?.( {
				select: registry.select,
				dispatch: registry.dispatch,
				context: getPatternOverridesContext(
					registry.select,
					clientId
				),
				clientId,
				bindings: {
					[ INNER_BLOCKS_BINDING_KEY ]: { newValue: serialized },
				},
			} );
		},
		[ registry, source, clientId ]
	);

	return {
		value,
		onChange: useCallback(
			( blocks: Block[] ) => write( blocks, true ),
			[ write ]
		),
		onInput: useCallback(
			( blocks: Block[] ) => write( blocks, false ),
			[ write ]
		),
	};
}
