import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useReducer, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { lock, lockDashed, lockOpen, unlock } from '@wordpress/icons';
import type { MouseEvent } from 'react';
import BlockLockModal from './modal';
import BlockLockContextMenu, { getContextMenuAnchorRect } from './context-menu';
import useBlockLock from './use-block-lock';
import { useLockBlocks, useUnlockBlocks } from './use-full-lock';
import { store as blockEditorStore } from '../../store';
import { unlock as unlockPrivateApis } from '../../lock-unlock';
import type { BlockLockControlProps } from './types';

/**
 * Renders the toolbar button of a locked block or pattern. Pressing it unlocks
 * the block and every block inside it, or locks them once unlocked, and
 * right-clicking it opens the lock menu at the pointer.
 *
 * The icon is a lock for a full lock, a lock with a dash for a partial lock,
 * and an open lock once unlocked, or for a pattern locked only by its layout.
 * Once unlocked, the button stays until the toolbar remounts and shows it.
 */
function BlockLockToolbarMenu( { clientId }: BlockLockControlProps ) {
	const { canLock, hasOwnLock, lockType, lockingSection } =
		useBlockLock( clientId );
	const lockBlocks = useLockBlocks();
	const unlockBlocks = useUnlockBlocks();
	const [ button, setButton ] = useState< HTMLButtonElement | null >( null );
	// Where the lock menu opens, set when the button is right-clicked.
	const [ menuAnchorRect, setMenuAnchorRect ] = useState< DOMRect | null >(
		null
	);
	// A block inside a pattern is locked by the pattern, so its lock can't
	// change.
	const isDisabled = !! lockingSection || ! canLock;
	const hasMenu = ! isDisabled;

	let icon = lockOpen;
	// A block inside a pattern is partly locked by the pattern, whose content
	// stays editable, unless its own lock is full.
	if ( hasOwnLock || lockingSection ) {
		icon = lockType === 'full' ? lock : lockDashed;
	}
	let label: string = hasOwnLock ? __( 'Unlock' ) : __( 'Lock' );
	if ( lockingSection ) {
		label = __( 'Locked by Pattern' );
	} else if ( ! canLock ) {
		label = __( 'Locked' );
	}

	return (
		<ToolbarGroup className="block-editor-block-lock-toolbar">
			<ToolbarButton
				ref={ setButton }
				icon={ icon }
				label={ label }
				disabled={ isDisabled }
				accessibleWhenDisabled
				onClick={ () => {
					if ( hasOwnLock ) {
						unlockBlocks( [ clientId ] );
					} else {
						lockBlocks( [ clientId ] );
					}
				} }
				onContextMenu={ ( event: MouseEvent< HTMLButtonElement > ) => {
					if ( ! hasMenu ) {
						return;
					}
					event.preventDefault();
					setMenuAnchorRect( getContextMenuAnchorRect( event ) );
				} }
			/>
			{ hasMenu && (
				<BlockLockContextMenu
					clientIds={ [ clientId ] }
					anchorRect={ menuAnchorRect }
					contextElement={ button }
					onClose={ () => setMenuAnchorRect( null ) }
				/>
			) }
		</ToolbarGroup>
	);
}

export default function BlockLockToolbar( {
	clientId,
}: BlockLockControlProps ) {
	const { canLock, isLocked, lockingSection } = useBlockLock( clientId );
	const isLockMenuEnabled = !! window.__experimentalBlockLockMenu;
	// With the lock menu, a block inside a pattern shows the pattern's lock.
	const hasLock = isLocked || ( isLockMenuEnabled && !! lockingSection );
	const isEditedPattern = useSelect(
		( select ) =>
			unlockPrivateApis(
				select( blockEditorStore )
			).getEditedContentOnlySection() === clientId,
		[ clientId ]
	);

	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive: boolean ) => ! isActive,
		false
	);
	const [ hasLockButtonShown, setHasLockButtonShown ] = useState( hasLock );

	// Once shown, keep the button until the toolbar remounts. Removing it
	// early, e.g. when unlocking from the modal, would lose the focus the
	// modal needs to return to it.
	if ( hasLock && ! hasLockButtonShown ) {
		setHasLockButtonShown( true );
	}

	if ( ! hasLockButtonShown ) {
		return null;
	}

	if ( isLockMenuEnabled ) {
		// A pattern being edited is temporarily unlocked, so it shows no lock.
		return isEditedPattern ? null : (
			<BlockLockToolbarMenu clientId={ clientId } />
		);
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
