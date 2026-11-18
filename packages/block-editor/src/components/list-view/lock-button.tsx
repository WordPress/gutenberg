import { __, sprintf } from '@wordpress/i18n';
import { forwardRef, useRef, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { lock, lockFilled } from '@wordpress/icons';
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import type { FocusEventHandler, MouseEvent } from 'react';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import { useBlockLock, useUnlockBlocks } from '../block-lock';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

interface ListViewLockButtonProps {
	/**
	 * The client ID of the block in the row.
	 */
	clientId: string;
	/**
	 * Roving tab index given by the tree grid.
	 */
	tabIndex?: number;
	/**
	 * Focus handler given by the tree grid.
	 */
	onFocus?: FocusEventHandler< HTMLButtonElement >;
}

/**
 * Moves focus to the block of a List View row, as unlocking can remove the
 * lock button that had it.
 *
 * @param row The List View row.
 */
function focusRowBlock( row: Element | null ) {
	window.requestAnimationFrame( () =>
		row
			?.querySelector< HTMLElement >(
				'.block-editor-list-view-block-select-button'
			)
			?.focus()
	);
}

/**
 * Renders the lock state of a locked block in its List View row: an outlined
 * lock for a partial lock and a filled lock for a full lock. Pressing it
 * unlocks the block and every block inside it. It is the same button as the
 * row's options menu toggle, so the two look alike.
 *
 * For a pattern, whose layout is locked by the pattern, pressing it asks to
 * detach the pattern, with the dialog the block settings menu uses for it.
 *
 * A block inside a pattern is edited content only, so its button is disabled,
 * but stays focusable so its label can say why. A block inside any other locked
 * block controls its own lock, so its button works.
 */
const ListViewLockButton = forwardRef<
	HTMLButtonElement,
	ListViewLockButtonProps
>( function UnforwardedListViewLockButton(
	{ clientId, tabIndex, onFocus },
	ref
) {
	const { canLock, lockType, lockingSection, isPatternLocked } =
		useBlockLock( clientId );
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const ancestorTitle = useBlockDisplayTitle( {
		clientId: lockingSection,
		context: 'list-view',
	} );
	const unlockBlocks = useUnlockBlocks();
	const { detachPattern } = unlock( useDispatch( blockEditorStore ) );
	const [ isDetachDialogOpen, setIsDetachDialogOpen ] = useState( false );
	const rowRef = useRef< Element | null >( null );

	let label: string = sprintf(
		/* translators: %s: The title of the block, e.g. "Group". */
		__( 'Unlock %s' ),
		blockTitle ?? ''
	);
	if ( isPatternLocked ) {
		label = __( 'Detach pattern' );
	} else if ( lockingSection ) {
		label = sprintf(
			/* translators: %s: The title of the parent block, e.g. "Group". */
			__( 'Locked by %s' ),
			ancestorTitle ?? ''
		);
	} else if ( ! canLock ) {
		label = __( 'Locked' );
	}

	return (
		<>
			<Button
				ref={ ref }
				className="block-editor-list-view-block__lock"
				size="small"
				icon={ lockType === 'full' ? lockFilled : lock }
				label={ label }
				disabled={ !! lockingSection || ! canLock }
				accessibleWhenDisabled
				tabIndex={ tabIndex }
				onFocus={ onFocus }
				aria-haspopup={ isPatternLocked ? 'dialog' : undefined }
				onClick={ ( event: MouseEvent< HTMLButtonElement > ) => {
					rowRef.current =
						event.currentTarget.closest( '[role="row"]' );
					if ( isPatternLocked ) {
						setIsDetachDialogOpen( true );
						return;
					}
					unlockBlocks( [ clientId ] );
					focusRowBlock( rowRef.current );
				} }
			/>
			<ConfirmDialog
				isOpen={ isDetachDialogOpen }
				onConfirm={ () => {
					setIsDetachDialogOpen( false );
					detachPattern( clientId );
					focusRowBlock( rowRef.current );
				} }
				onCancel={ () => setIsDetachDialogOpen( false ) }
				confirmButtonText={ __( 'Detach' ) }
				size="medium"
				title={ __( 'Detach pattern' ) }
				__experimentalHideHeader={ false }
			>
				{ __(
					'Detach this pattern to edit the blocks independently.'
				) }
			</ConfirmDialog>
		</>
	);
} );

export default ListViewLockButton;
