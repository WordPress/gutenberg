import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useReducer, useState } from '@wordpress/element';
import { lock, unlock } from '@wordpress/icons';
import BlockLockModal from './modal';
import useBlockLock from './use-block-lock';
import type { BlockLockControlProps } from './types';

export default function BlockLockToolbar( {
	clientId,
}: BlockLockControlProps ) {
	const { canLock, isLocked } = useBlockLock( clientId );

	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive: boolean ) => ! isActive,
		false
	);
	const [ hasLockButtonShown, setHasLockButtonShown ] = useState( isLocked );

	// Once shown, keep the button until the toolbar remounts. Removing it
	// early, e.g. when unlocking from the modal, would lose the focus the
	// modal needs to return to it.
	if ( isLocked && ! hasLockButtonShown ) {
		setHasLockButtonShown( true );
	}

	if ( ! hasLockButtonShown ) {
		return null;
	}

	let label: string = isLocked ? __( 'Unlock' ) : __( 'Lock' );

	if ( ! canLock && isLocked ) {
		label = __( 'Locked' );
	}

	return (
		<>
			<ToolbarGroup className="block-editor-block-lock-toolbar">
				<ToolbarButton
					disabled={ ! canLock }
					icon={ isLocked ? lock : unlock }
					label={ label }
					onClick={ toggleModal }
					aria-expanded={ isModalOpen }
					aria-haspopup="dialog"
				/>
			</ToolbarGroup>
			{ isModalOpen && (
				<BlockLockModal clientId={ clientId } onClose={ toggleModal } />
			) }
		</>
	);
}
