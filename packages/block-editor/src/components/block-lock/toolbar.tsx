import { __ } from '@wordpress/i18n';
import {
	Button,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { useReducer, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { lock, lockDashed, lockOpen, unlock } from '@wordpress/icons';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import BlockLockModal from './modal';
import BlockLockMenuItems from './lock-menu-items';
import useBlockLock from './use-block-lock';
import { store as blockEditorStore } from '../../store';
import { unlock as unlockPrivateApis } from '../../lock-unlock';
import type { BlockLockControlProps } from './types';

/**
 * Renders the toolbar button of a locked block, which opens the lock menu.
 * The icon is a lock for a full lock, a lock with a dash for a partial lock,
 * and an open lock once unlocked. Once unlocked, the button stays until the
 * toolbar remounts and shows it.
 */
function BlockLockToolbarMenu( { clientId }: BlockLockControlProps ) {
	const { canLock, lockType } = useBlockLock( clientId );
	const label = canLock ? __( 'Lock' ) : __( 'Locked' );
	let icon = lock;
	if ( lockType === 'partial' ) {
		icon = lockDashed;
	} else if ( lockType === 'none' ) {
		icon = lockOpen;
	}

	return (
		<ToolbarGroup className="block-editor-block-lock-toolbar">
			<Menu.Root>
				<ToolbarItem>
					{ ( toolbarItemProps ) => (
						<Menu.Trigger
							{ ...toolbarItemProps }
							disabled={ ! canLock }
							render={
								<Button
									size="compact"
									icon={ icon }
									label={ label }
									accessibleWhenDisabled
								/>
							}
						/>
					) }
				</ToolbarItem>
				<Menu.Popup
					positioner={
						<Menu.Positioner side="bottom" align="start" />
					}
				>
					<BlockLockMenuItems clientIds={ [ clientId ] } />
				</Menu.Popup>
			</Menu.Root>
		</ToolbarGroup>
	);
}

export default function BlockLockToolbar( {
	clientId,
}: BlockLockControlProps ) {
	const { canLock, isLocked } = useBlockLock( clientId );
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

	if ( window.__experimentalBlockLockMenu ) {
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
