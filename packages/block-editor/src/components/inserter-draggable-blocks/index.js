/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockDraggableChip from '../block-draggable/draggable-chip';
import { INSERTER_PATTERN_TYPES } from '../inserter/block-patterns-tab/utils';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const InserterDraggableBlocks = ( {
	isEnabled,
	blocks,
	icon,
	children,
	pattern,
} ) => {
	const blockTypeIcon = useSelect(
		( select ) => {
			const { getBlockType } = select( blocksStore );
			return (
				blocks.length === 1 && getBlockType( blocks[ 0 ].name )?.icon
			);
		},
		[ blocks ]
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
				for ( const block of draggableBlocks ) {
					const type = `wp-block:${ block.name }`;
					// This will fill in the dataTransfer.types array so that
					// the drop zone can check if the draggable is eligible.
					// Unfortuantely, on drag start, we don't have access to the
					// actual data, only the data keys/types.
					event.dataTransfer.items.add( '', type );
				}
			} }
			onDragEnd={ () => {
				stopDragging();
			} }
			__experimentalDragComponent={
				<BlockDraggableChip
					count={ blocks.length }
					icon={ icon || ( ! pattern && blockTypeIcon ) }
					isPattern={ !! pattern }
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
};

export default InserterDraggableBlocks;
