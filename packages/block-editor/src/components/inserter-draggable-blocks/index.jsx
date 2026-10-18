import { Draggable } from '@wordpress/components';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import BlockDraggableChip from '../block-draggable/draggable-chip';
import { INSERTER_PATTERN_TYPES } from '../inserter/block-patterns-tab/utils';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/** @typedef {import('@wordpress/blocks').Block} Block */
/** @typedef {import('@wordpress/blocks').BlockTypeIcon} BlockTypeIcon */

/**
 * The parts of a pattern this component reads. A synced user pattern drags as
 * a single `core/block` reference rather than as its inner blocks.
 *
 * @typedef {Object} DraggablePattern
 * @property {string}        [type]       One of `INSERTER_PATTERN_TYPES`.
 * @property {string}        [syncStatus] `'unsynced'` for a user pattern that isn't synced.
 * @property {number|string} [id]         The pattern's id.
 */

/**
 * What the render prop is called with. The handlers are absent when dragging
 * is disabled, so callers that forward them to something other than a DOM
 * prop need to check.
 *
 * @typedef {Object} DraggableRenderProps
 * @property {boolean}                draggable     Whether the element should be draggable.
 * @property {React.DragEventHandler} [onDragStart] Starts the drag.
 * @property {React.DragEventHandler} [onDragEnd]   Ends the drag.
 */

/**
 * Renders the drag source.
 *
 * @typedef {(props: DraggableRenderProps) => React.ReactElement} DraggableChildren
 */

/**
 * Makes its children a drag source for a set of blocks.
 *
 * @param {Object}            props
 * @param {boolean}           props.isEnabled Whether the children can be dragged.
 * @param {Block[]}           props.blocks    The blocks to drag.
 * @param {DraggableChildren} props.children  Renders the drag source.
 * @param {BlockTypeIcon}     [props.icon]    Icon for the drag chip. Defaults to the block type's icon when dragging a single block that isn't a pattern.
 * @param {DraggablePattern}  [props.pattern] The pattern the blocks came from, if any.
 * @return {React.ReactElement} The drag source.
 */
export default function InserterDraggableBlocks( {
	isEnabled,
	blocks,
	icon,
	children,
	pattern,
} ) {
	const blockName = blocks.length === 1 ? blocks[ 0 ].name : undefined;
	const isPattern = !! pattern;
	// Fallback for callers that pass no icon (the media tab).
	const blockTypeIcon = useSelect(
		( select ) => {
			if ( icon || isPattern || ! blockName ) {
				return;
			}
			return select( blocksStore ).getBlockType( blockName )?.icon;
		},
		[ icon, isPattern, blockName ]
	);

	const { startDragging, stopDragging } = unlock(
		useDispatch( blockEditorStore )
	);

	const patternBlock = useMemo( () => {
		return pattern?.type === INSERTER_PATTERN_TYPES.user &&
			pattern?.syncStatus !== 'unsynced'
			? [ createBlock( 'core/block', { ref: pattern.id } ) ]
			: undefined;
	}, [ pattern?.type, pattern?.syncStatus, pattern?.id ] );

	if ( ! isEnabled ) {
		return children( {
			draggable: false,
			onDragStart: undefined,
			onDragEnd: undefined,
		} );
	}

	const draggableBlocks = patternBlock ?? blocks;
	return (
		<Draggable
			__experimentalTransferDataType="wp-blocks"
			transferData={ { type: 'inserter', blocks: draggableBlocks } }
			onDragStart={ ( event ) => {
				startDragging();
				const addedTypes = new Set();
				for ( const block of draggableBlocks ) {
					const type = `wp-block:${ block.name }`;
					/*
					 * Only add each block type once to avoid DataTransferItemList::add `NotSupportedError`
					 * when patterns contain multiple blocks of the same type.
					 */
					if ( ! addedTypes.has( type ) ) {
						/*
						 * This will fill in the dataTransfer.types array so that
						 * the drop zone can check if the draggable is eligible.
						 * Unfortunately, on drag start, we don't have access to the
						 * actual data, only the data keys/types.
						 */
						event.dataTransfer.items.add( '', type );
						addedTypes.add( type );
					}
				}
			} }
			onDragEnd={ () => {
				stopDragging();
			} }
			__experimentalDragComponent={
				<BlockDraggableChip
					count={ blocks.length }
					icon={ icon || blockTypeIcon }
					isPattern={ isPattern }
				/>
			}
		>
			{ ( { onDraggableStart, onDraggableEnd } ) => {
				return children( {
					draggable: true,
					onDragStart: onDraggableStart,
					onDragEnd: onDraggableEnd,
				} );
			} }
		</Draggable>
	);
}
