/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';
import { serialize, store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import BlockDraggableChip from '../block-draggable/draggable-chip';

const InserterDraggableBlocks = ( {
	isEnabled,
	blocks,
	icon,
	children,
	isPattern,
} ) => {
	const transferData = {
		type: 'inserter',
		blocks,
	};

	const blockTypeIcon = useSelect(
		( select ) => {
			const { getBlockType } = select( blocksStore );
			return (
				blocks.length === 1 && getBlockType( blocks[ 0 ].name )?.icon
			);
		},
		[ blocks ]
	);

	return (
		<Draggable
			__experimentalTransferDataType="wp-blocks"
			transferData={ transferData }
			onDragStart={ ( event ) => {
				event.dataTransfer.setData( 'text/html', serialize( blocks ) );
			} }
			__experimentalDragComponent={
				<BlockDraggableChip
					count={ blocks.length }
					icon={ icon || ( ! isPattern && blockTypeIcon ) }
					isPattern={ isPattern }
				/>
			}
		>
			{ ( { onDraggableStart, onDraggableEnd } ) => {
				return children( {
					draggable: isEnabled,
					onDragStart: isEnabled ? onDraggableStart : undefined,
					onDragEnd: isEnabled ? onDraggableEnd : undefined,
				} );
			} }
		</Draggable>
	);
};

export default InserterDraggableBlocks;
