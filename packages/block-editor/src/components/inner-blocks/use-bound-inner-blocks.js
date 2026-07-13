/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { parse, serialize, store as blocksStore } from '@wordpress/blocks';
import {
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockContext from '../block-context';
import {
	getBlockBindingsContext,
	INNER_BLOCKS_BINDING_KEY,
} from '../../utils/block-bindings';
import { unlock } from '../../lock-unlock';

const EMPTY_ARRAY = [];

/**
 * Resolves controlled InnerBlocks props from a structural binding.
 *
 * @param {string}           clientId  Host block client ID.
 * @param {Object|undefined} binding   Structural binding descriptor.
 * @param {Object}           blockType Host block type.
 * @return {Object|undefined} Controlled inner-block props.
 */
export function useBoundInnerBlocksProps( clientId, binding, blockType ) {
	const registry = useRegistry();
	const blockContext = useContext( BlockContext );
	const appliedRef = useRef( { serialized: undefined, blocks: undefined } );

	const sourceName =
		typeof binding?.source === 'string' && binding.source !== ''
			? binding.source
			: undefined;
	const args =
		sourceName &&
		binding?.args !== null &&
		typeof binding?.args === 'object'
			? binding.args
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
		[ blockContext, resolvedBlockType, source ]
	);
	const hasCurrentFallbackSlot = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return false;
			}
			return select( blockEditorStore ).getBlocks( clientId ).length > 0;
		},
		[ clientId ]
	);
	const [ hasFallbackSlot ] = useState( hasCurrentFallbackSlot );
	const serialized = useSelect(
		( select ) => {
			if ( ! source?.getValues ) {
				return undefined;
			}
			const values = source.getValues( {
				select,
				context,
				clientId,
				bindings: { [ INNER_BLOCKS_BINDING_KEY ]: { args } },
			} );
			const value = values?.[ INNER_BLOCKS_BINDING_KEY ];
			return typeof value === 'string' ? value : undefined;
		},
		[ source, context, clientId, args ]
	);
	const value = useMemo( () => {
		if (
			serialized === undefined ||
			( serialized !== '' && ! hasFallbackSlot )
		) {
			return undefined;
		}
		if ( appliedRef.current.serialized === serialized ) {
			return appliedRef.current.blocks;
		}
		const blocks = serialized === '' ? EMPTY_ARRAY : parse( serialized );
		appliedRef.current = { serialized, blocks };
		return blocks;
	}, [ serialized, hasFallbackSlot ] );

	const writeBack = useCallback(
		( blocks, persistent ) => {
			if (
				clientId &&
				! registry
					.select( blockEditorStore )
					.areInnerBlocksControlled( clientId )
			) {
				return;
			}
			if ( ! source?.setValues ) {
				return;
			}

			const newValue = serialize( blocks );
			if ( ! persistent && newValue === appliedRef.current.serialized ) {
				return;
			}
			appliedRef.current = { serialized: newValue, blocks };

			registry.batch( () => {
				const blockEditorDispatch =
					registry.dispatch( blockEditorStore );
				const dispatch = persistent
					? registry.dispatch
					: ( store ) => {
							const actions = registry.dispatch( store );
							if ( actions === blockEditorDispatch ) {
								blockEditorDispatch.__unstableMarkNextChangeAsNotPersistent();
							}
							return actions;
					  };
				source.setValues( {
					select: registry.select,
					dispatch,
					context,
					clientId,
					bindings: {
						[ INNER_BLOCKS_BINDING_KEY ]: { args, newValue },
					},
				} );
			} );
		},
		[ source, registry, context, clientId, args ]
	);
	const onChange = useCallback(
		( blocks ) => writeBack( blocks, true ),
		[ writeBack ]
	);
	const onInput = useCallback(
		( blocks ) => writeBack( blocks, false ),
		[ writeBack ]
	);
	const boundProps = useMemo(
		() =>
			source && value !== undefined
				? { value, onChange, onInput }
				: undefined,
		[ source, value, onChange, onInput ]
	);

	const wasControlledRef = useRef( false );
	const wasControlledLayoutRef = useRef( false );
	const releasedBlocksRef = useRef( EMPTY_ARRAY );
	useLayoutEffect( () => {
		const isControlled = boundProps !== undefined;
		if ( wasControlledLayoutRef.current && ! isControlled && clientId ) {
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
			if (
				restoreBlocks.length &&
				registry
					.select( blockEditorStore )
					.getBlockCount( clientId ) === 0
			) {
				const {
					replaceInnerBlocks,
					__unstableMarkNextChangeAsNotPersistent,
				} = registry.dispatch( blockEditorStore );
				__unstableMarkNextChangeAsNotPersistent();
				replaceInnerBlocks( clientId, restoreBlocks );
			}
		}
		wasControlledRef.current = isControlled;
	} );

	return boundProps;
}
