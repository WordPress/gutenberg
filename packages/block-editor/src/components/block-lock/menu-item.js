/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useReducer } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { lock, unlock } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockLockModal from './modal';
import { store as blockEditorStore } from '../../store';

export default function BlockLockMenuItem( { clientId } ) {
	const { isLocked } = useSelect(
		( select ) => {
			const { canMoveBlock, canRemoveBlock } = select( blockEditorStore );

			return {
				isLocked:
					! canMoveBlock( clientId ) || ! canRemoveBlock( clientId ),
			};
		},
		[ clientId ]
	);

	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	const label = isLocked ? __( 'Unlock' ) : __( 'Lock' );

	return (
		<>
			<MenuItem icon={ isLocked ? unlock : lock } onClick={ toggleModal }>
				{ label }
			</MenuItem>
			{ isModalOpen && (
				<BlockLockModal clientId={ clientId } onClose={ toggleModal } />
			) }
		</>
	);
}
