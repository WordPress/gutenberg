import { createContext, useContext, useMemo, useRef } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';
import { useRegistry, useSelect } from '@wordpress/data';
import type { SelectFunction } from '@wordpress/data';
import {
	parse,
	serialize,
	store as blocksStore,
	type Block,
	type BlockBindingsSource,
} from '@wordpress/blocks';
import BlockContext from '../block-context';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import {
	INNER_BLOCKS_BINDING_KEY,
	getBlockBindingsContext,
	getInnerBlocksBinding,
	isInnerBlocksBindingValue,
} from '../../utils/block-bindings';
import type { Binding } from '../../utils/block-bindings';
import type { OnBlockUpdate } from '../provider/types';
import type { BoundInnerBlocks } from '../../store/types';

declare global {
	interface Window {
		/**
		 * Whether the Gutenberg experiment that binds inner blocks to block
		 * bindings sources is enabled.
		 */
		__experimentalInnerBlocksBindings?: boolean;
	}
}

const EMPTY_ARRAY: Block[] = [];

interface BoundValue {
	serialized: string;
	blocks: Block[];
}

/**
 * Serializes inner blocks, with every block delimited, so that the markup
 * always starts with a block.
 *
 * @param blocks The inner blocks.
 *
 * @return The serialized inner blocks.
 */
function serializeInnerBlocks( blocks: Block[] ) {
	return serialize( blocks, { isInnerBlocks: true } );
}

/**
 * The bound inner blocks that a block is in, by source and value, to stop a
 * value that contains a block bound to itself from rendering forever.
 */
const BoundInnerBlocksAncestorsContext = createContext< string[] >( [] );

export const BoundInnerBlocksAncestorsProvider =
	BoundInnerBlocksAncestorsContext.Provider;

/**
 * How deep bound inner blocks can be nested.
 */
const MAX_DEPTH = 8;

/**
 * Returns the context a source uses, read from the store when the block's
 * ancestors provide it from their attributes. Unlike the block context, which
 * only updates once the block renders again, it already reflects the source's
 * own writes, e.g. to the attributes of a synced pattern.
 *
 * @param select       The registry's select function.
 * @param clientId     The block's client ID.
 * @param blockContext The block context.
 * @param usesContext  The context the source uses.
 *
 * @return The context for the source.
 */
function getSourceContext(
	select: SelectFunction,
	clientId: string,
	blockContext: Record< string, unknown >,
	usesContext: readonly string[] | undefined
) {
	if ( ! usesContext?.length ) {
		return blockContext;
	}
	const { getBlockParents, getBlockName, getBlockAttributes } =
		select( blockEditorStore );
	const { getBlockType } = select( blocksStore );
	const keys = new Set( usesContext );
	let sourceContext = blockContext;
	for ( const parentClientId of getBlockParents( clientId, true ) ) {
		const providesContext = getBlockType( getBlockName( parentClientId )! )
			?.providesContext as Record< string, string > | undefined;
		if ( ! providesContext ) {
			continue;
		}
		for ( const key of keys ) {
			if ( key in providesContext && key in blockContext ) {
				sourceContext = {
					...sourceContext,
					[ key ]:
						getBlockAttributes( parentClientId )?.[
							providesContext[ key ]
						],
				};
				keys.delete( key );
			}
		}
		if ( ! keys.size ) {
			break;
		}
	}
	return sourceContext;
}

export interface InnerBlocksBinding {
	binding: Binding;
	source: Omit< BlockBindingsSource, 'name' >;
	context: Record< string, unknown >;
}

/**
 * Returns whether the experiment that binds inner blocks to block bindings
 * sources is enabled.
 *
 * @return Whether inner blocks can be bound.
 */
export function isInnerBlocksBindingEnabled() {
	return (
		typeof window !== 'undefined' &&
		!! window.__experimentalInnerBlocksBindings
	);
}

/**
 * Returns the source that a block's inner blocks are bound to, when the block
 * supports it, the source is registered, and the context the source uses is
 * available. Otherwise, the block's inner blocks are its own.
 *
 * @param clientId  The block's client ID.
 * @param blockName The block's name.
 *
 * @return The binding, its source, and the context to resolve it with.
 */
export function useInnerBlocksBinding(
	clientId: string,
	blockName?: string | null
): InnerBlocksBinding | undefined {
	const blockContext = useContext( BlockContext );
	const { binding, source } = useSelect(
		( select ) => {
			const { getBlockAttributes, getSettings } =
				select( blockEditorStore );
			const supportedAttributes = (
				getSettings().__experimentalBlockBindingsSupportedAttributes as
					Record< string, string[] > | undefined
			 )?.[ blockName! ];
			if ( ! supportedAttributes?.includes( INNER_BLOCKS_BINDING_KEY ) ) {
				return {};
			}
			const _binding = getInnerBlocksBinding(
				getBlockAttributes( clientId )?.metadata?.bindings
			);
			return {
				binding: _binding,
				source: _binding
					? unlock( select( blocksStore ) ).getBlockBindingsSource(
							_binding.source
						)
					: undefined,
			};
		},
		[ clientId, blockName ]
	);
	const context = useMemo(
		() =>
			source
				? getBlockBindingsContext( blockContext, undefined, [ source ] )
				: undefined,
		[ blockContext, source ]
	);
	const isLive =
		!! source &&
		!! context &&
		( source.usesContext ?? [] ).every( ( key: string ) => key in context );
	if ( ! isLive || ! binding ) {
		return undefined;
	}
	return { binding, source, context };
}

/**
 * Returns the value of inner blocks bound to a source, and how to write it back,
 * for a controller of the block's inner blocks.
 *
 * - Serialized block markup replaces the block's own inner blocks.
 * - `''` means there are no inner blocks.
 * - Anything else falls back to the block's own inner blocks, which the
 *   source only receives once the user edits them.
 *
 * @param clientId                   The block's client ID.
 * @param innerBlocksBinding         The binding, from `useInnerBlocksBinding`.
 * @param innerBlocksBinding.binding The binding.
 * @param innerBlocksBinding.source  The source.
 * @param innerBlocksBinding.context The context to resolve the binding with.
 *
 * @return The bound inner blocks, or `undefined` when they'd be nested in
 *         themselves.
 */
export function useBoundInnerBlocks(
	clientId: string,
	{ binding, source, context }: InnerBlocksBinding
) {
	const registry = useRegistry();
	const ancestors = useContext( BoundInnerBlocksAncestorsContext );
	// The value parsed last, or written back last, is given back as it is while
	// the source returns the same markup. When the source echoes a value
	// written back, the controlled inner blocks, and the caret, stay in place.
	const boundValueRef = useRef< BoundValue >( undefined );
	const { boundValue, ownInnerBlocks, editable } = useSelect(
		( select ) => {
			const sourceContext = getSourceContext(
				select,
				clientId,
				context,
				source.usesContext
			);
			const sourceValue = (
				source.getValues?.( {
					select,
					context: sourceContext,
					clientId,
					bindings: {
						[ INNER_BLOCKS_BINDING_KEY ]: { args: binding.args },
					},
				} ) as Record< string, unknown > | undefined
			 )?.[ INNER_BLOCKS_BINDING_KEY ];
			if (
				isInnerBlocksBindingValue( sourceValue ) &&
				boundValueRef.current?.serialized !== sourceValue
			) {
				boundValueRef.current = {
					serialized: sourceValue,
					blocks:
						sourceValue === '' ? EMPTY_ARRAY : parse( sourceValue ),
				};
			}
			return {
				boundValue: isInnerBlocksBindingValue( sourceValue )
					? boundValueRef.current
					: undefined,
				// The block's tree entry keeps its own inner blocks while
				// they're bound.
				ownInnerBlocks: select( blockEditorStore ).getBlock( clientId )
					?.innerBlocks as Block[] | undefined,
				editable:
					!! source.getValues &&
					!! source.setValues &&
					!! source.canUserEditValue?.( {
						select,
						context: sourceContext,
						args: binding.args,
					} ),
			};
		},
		[ source, clientId, context, binding.args ]
	);
	const hasValue = !! boundValue;
	const fallback = ownInnerBlocks?.length ? ownInnerBlocks : EMPTY_ARRAY;
	const value = boundValue?.blocks ?? fallback;

	const writeBack = useEvent(
		( blocks: Block[], options: Parameters< OnBlockUpdate >[ 1 ] ) => {
			const {
				areInnerBlocksControlled,
				getSelectionStart,
				getBlockParents,
			} = registry.select( blockEditorStore );
			// Changes that sync the controlled inner blocks, rather than edit
			// them, aren't written back, and neither are the changes of a
			// controller that lost control, e.g. to an undo.
			if (
				! editable ||
				options?.undoIgnore ||
				! areInnerBlocksControlled( clientId )
			) {
				return;
			}
			const sourceContext = getSourceContext(
				registry.select,
				clientId,
				context,
				source.usesContext
			);
			const sourceValue = (
				source.getValues?.( {
					select: registry.select,
					context: sourceContext,
					clientId,
					bindings: {
						[ INNER_BLOCKS_BINDING_KEY ]: { args: binding.args },
					},
				} ) as Record< string, unknown > | undefined
			 )?.[ INNER_BLOCKS_BINDING_KEY ];
			const hasSourceValue = isInnerBlocksBindingValue( sourceValue );
			if ( ! hasSourceValue ) {
				// Until the user edits the fallback, changes to it, e.g. made
				// when its blocks mount, don't give the source a value.
				const selectedClientId = getSelectionStart().clientId;
				if (
					! selectedClientId ||
					( selectedClientId !== clientId &&
						! getBlockParents( selectedClientId ).includes(
							clientId
						) )
				) {
					return;
				}
			}
			const serialized = serializeInnerBlocks( blocks );
			if (
				serialized ===
				( hasSourceValue
					? sourceValue
					: serializeInnerBlocks( fallback ) )
			) {
				return;
			}
			boundValueRef.current = { serialized, blocks };
			const { markNextChangeAsDerived } = unlock(
				registry.dispatch( blockEditorStore )
			);
			source.setValues!( {
				select: registry.select,
				// The source's own block editor changes follow the change that
				// they write back, for undo levels.
				dispatch: (
					store: Parameters< typeof registry.dispatch >[ 0 ]
				) => {
					const actions = registry.dispatch( store );
					const storeName =
						typeof store === 'string' ? store : store.name;
					if ( storeName !== blockEditorStore.name ) {
						return actions;
					}
					return Object.fromEntries(
						Object.entries( actions ).map( ( [ name, action ] ) => [
							name,
							typeof action === 'function'
								? ( ...args: unknown[] ) => {
										markNextChangeAsDerived();
										return action( ...args );
									}
								: action,
						] )
					);
				},
				context: sourceContext,
				clientId,
				bindings: {
					[ INNER_BLOCKS_BINDING_KEY ]: {
						args: binding.args,
						newValue: serialized,
					},
				},
			} );
		}
	);

	const boundInnerBlocks = useMemo< BoundInnerBlocks >(
		() => ( { editable } ),
		[ editable ]
	);

	const recursionKey = `${ binding.source }|${ boundValue?.serialized ?? '' }`;
	const ancestorKeys = useMemo(
		() => [ ...ancestors, recursionKey ],
		[ ancestors, recursionKey ]
	);
	if (
		ancestors.length >= MAX_DEPTH ||
		( hasValue && ancestors.includes( recursionKey ) )
	) {
		return undefined;
	}

	return {
		value,
		onChange: writeBack,
		onInput: writeBack,
		boundInnerBlocks,
		ancestorKeys,
	};
}
