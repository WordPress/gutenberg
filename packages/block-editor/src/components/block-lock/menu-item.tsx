import { __ } from '@wordpress/i18n';
import { useReducer } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { lockOutline, unlock } from '@wordpress/icons';
import useBlocksLock from './use-blocks-lock';
import type { BlocksLockControlProps } from './types';
import BlockLockModal from './modal';

export default function BlockLockMenuItem( {
	clientIds,
}: BlocksLockControlProps ) {
	const { canLock, isLocked } = useBlocksLock( clientIds );

	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive: boolean ) => ! isActive,
		false
	);

	if ( ! canLock ) {
		return null;
	}

	const label = isLocked ? __( 'Unlock' ) : __( 'Lock' );

	return (
		<>
			<MenuItem
				icon={ isLocked ? unlock : lockOutline }
				onClick={ toggleModal }
				aria-expanded={ isModalOpen }
				aria-haspopup="dialog"
			>
				{ label }
			</MenuItem>
			{ isModalOpen && (
				<BlockLockModal
					clientIds={ clientIds }
					onClose={ toggleModal }
				/>
			) }
		</>
	);
}
