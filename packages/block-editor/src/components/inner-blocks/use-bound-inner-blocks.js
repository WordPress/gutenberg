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
 * @param {string}           clientId                  Host block client ID.
 * @param {Object|undefined} binding                   Structural binding descriptor.
 * @param {Object}           blockType                 Host block type.
 * @param {boolean}          isPatternOverrideInstance Whether the host belongs to one synced-pattern instance.
 * @return {Object|undefined} Controlled inner-block props.
 */
export function useBoundInnerBlocksProps(
	clientId,
	binding,
	blockType,
	isPatternOverrideInstance = false
) {
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
	const currentFallbackBlocks = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return EMPTY_ARRAY;
			}
			return select( blockEditorStore ).getBlocks( clientId );
		},
		[ clientId ]
	);
	// Keep the pattern entity's original children separate from the controlled
	// instance tree. This lets absence render the fallback while the first edit
	// creates an override, and lets Reset restore the original fallback.
	const [ fallbackBlocks ] = useState( () => [ ...currentFallbackBlocks ] );
	const hasFallbackSlot = fallbackBlocks.length > 0;
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
		if ( serialized === undefined ) {
			return isPatternOverrideInstance && hasFallbackSlot
				? fallbackBlocks
				: undefined;
		}
		if ( serialized !== '' && ! hasFallbackSlot ) {
			return undefined;
		}
		if ( appliedRef.current.serialized === serialized ) {
			return appliedRef.current.blocks;
		}
		const blocks = serialized === '' ? EMPTY_ARRAY : parse( serialized );
		appliedRef.current = { serialized, blocks };
		return blocks;
	}, [
		serialized,
		hasFallbackSlot,
		fallbackBlocks,
		isPatternOverrideInstance,
	] );

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
	const editableClientIds = useSelect(
		( select ) => {
			if ( ! boundProps || ! clientId || ! isPatternOverrideInstance ) {
				return EMPTY_ARRAY;
			}

			const blockEditor = select( blockEditorStore );
			if ( unlock( blockEditor ).isZoomOut() ) {
				return EMPTY_ARRAY;
			}

			return blockEditor
				.getClientIdsOfDescendants( clientId )
				.filter(
					( id ) =>
						blockEditor.getBlockName( id ) !== 'core/block' &&
						blockEditor.getBlockParentsByBlockName(
							id,
							'core/block',
							true
						).length === 1
				);
		},
		[ boundProps, clientId, isPatternOverrideInstance ]
	);
	const editingModeOwnershipRef = useRef( new Map() );
	useLayoutEffect( () => {
		const blockEditorSelect = registry.select( blockEditorStore );
		const { getExplicitBlockEditingMode } = unlock( blockEditorSelect );
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );
		const ownedModes = editingModeOwnershipRef.current;
		const desiredClientIds = new Set( editableClientIds );

		registry.batch( () => {
			ownedModes.forEach( ( appliedMode, id ) => {
				if ( getExplicitBlockEditingMode( id ) !== appliedMode ) {
					ownedModes.delete( id );
					return;
				}
				if ( desiredClientIds.has( id ) ) {
					return;
				}
				unsetBlockEditingMode( id );
				ownedModes.delete( id );
			} );

			desiredClientIds.forEach( ( id ) => {
				if (
					ownedModes.has( id ) ||
					getExplicitBlockEditingMode( id ) !== undefined
				) {
					return;
				}
				setBlockEditingMode( id, 'default' );
				ownedModes.set( id, 'default' );
			} );
		} );
	}, [ editableClientIds, registry ] );
	useLayoutEffect( () => {
		const ownedModes = editingModeOwnershipRef.current;
		return () => {
			const blockEditorSelect = registry.select( blockEditorStore );
			const { getExplicitBlockEditingMode } = unlock( blockEditorSelect );
			const { unsetBlockEditingMode } =
				registry.dispatch( blockEditorStore );
			registry.batch( () => {
				ownedModes.forEach( ( appliedMode, id ) => {
					if ( getExplicitBlockEditingMode( id ) === appliedMode ) {
						unsetBlockEditingMode( id );
					}
				} );
				ownedModes.clear();
			} );
		};
	}, [ registry ] );

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
