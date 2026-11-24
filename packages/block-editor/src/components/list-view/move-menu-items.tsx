import { MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { store as blockEditorStore } from '../../store';
import type { BlockMoveDestination } from '../../store/private-selectors';
import { useListViewContext } from './context';

/**
 * The "Move up" and "Move down" items for a custom row menu
 * (`blockSettingsMenu`). They move the blocks one step, following which rows
 * the List View shows expanded.
 *
 * @param props           Component props.
 * @param props.clientIds The blocks to move.
 * @param props.onClose   Closes the menu.
 */
export default function ListViewMoveMenuItems( {
	clientIds,
	onClose,
}: {
	clientIds: string[];
	onClose: () => void;
} ) {
	const { getMoveDestination } = useListViewContext();
	const { getBlockRootClientId } = useSelect( blockEditorStore );
	const { moveBlocksToPosition } = useDispatch( blockEditorStore );

	// Read when the menu opens, so the moves follow the rows the List View
	// shows expanded right now.
	const moveUpTo = getMoveDestination( clientIds, 'up' );
	const moveDownTo = getMoveDestination( clientIds, 'down' );
	const move = ( destination: BlockMoveDestination | null ) => {
		if ( ! destination ) {
			return;
		}
		moveBlocksToPosition(
			clientIds,
			getBlockRootClientId( clientIds[ 0 ] ),
			destination.rootClientId,
			destination.index
		);
		onClose();
	};

	return (
		<>
			<MenuItem
				icon={ chevronUp }
				disabled={ ! moveUpTo }
				accessibleWhenDisabled
				onClick={ () => move( moveUpTo ) }
			>
				{ __( 'Move up' ) }
			</MenuItem>
			<MenuItem
				icon={ chevronDown }
				disabled={ ! moveDownTo }
				accessibleWhenDisabled
				onClick={ () => move( moveDownTo ) }
			>
				{ __( 'Move down' ) }
			</MenuItem>
		</>
	);
}
