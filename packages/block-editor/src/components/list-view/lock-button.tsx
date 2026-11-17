import { __, sprintf } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import { lock, lockFilled } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import type { FocusEventHandler, MouseEvent } from 'react';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import { useBlockLock, useUnlockBlocks } from '../block-lock';

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
 * Renders the lock state of a locked block in its List View row: an outlined
 * lock for a partial lock and a filled lock for a full lock. Pressing it
 * unlocks the block and every block inside it. It is the same button as the
 * row's options menu toggle, so the two look alike.
 *
 * The button is disabled, but stays focusable so its label can say why, for a
 * pattern, which is unlocked by editing or detaching it, and for a block inside
 * a layout-locked block, which is kept in place by that ancestor.
 */
const ListViewLockButton = forwardRef<
	HTMLButtonElement,
	ListViewLockButtonProps
>( function UnforwardedListViewLockButton(
	{ clientId, tabIndex, onFocus },
	ref
) {
	const { canLock, lockType, layoutLockedAncestor, isPatternLocked } =
		useBlockLock( clientId );
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const ancestorTitle = useBlockDisplayTitle( {
		clientId: layoutLockedAncestor,
		context: 'list-view',
	} );
	const unlockBlocks = useUnlockBlocks();

	let label: string = sprintf(
		/* translators: %s: The title of the block, e.g. "Group". */
		__( 'Unlock %s' ),
		blockTitle ?? ''
	);
	if ( isPatternLocked ) {
		label = __( 'Locked by its pattern' );
	} else if ( layoutLockedAncestor ) {
		label = sprintf(
			/* translators: %s: The title of the parent block, e.g. "Group". */
			__( 'Locked by %s' ),
			ancestorTitle ?? ''
		);
	} else if ( ! canLock ) {
		label = __( 'Locked' );
	}

	return (
		<Button
			ref={ ref }
			className="block-editor-list-view-block__lock"
			size="small"
			icon={ lockType === 'full' ? lockFilled : lock }
			label={ label }
			disabled={ isPatternLocked || !! layoutLockedAncestor || ! canLock }
			accessibleWhenDisabled
			tabIndex={ tabIndex }
			onFocus={ onFocus }
			onClick={ ( event: MouseEvent< HTMLButtonElement > ) => {
				// Unlocking removes the button, so keep focus in its row.
				const row = event.currentTarget.closest( '[role="row"]' );
				unlockBlocks( [ clientId ] );
				window.requestAnimationFrame( () =>
					row
						?.querySelector< HTMLElement >(
							'.block-editor-list-view-block-select-button'
						)
						?.focus()
				);
			} }
		/>
	);
} );

export default ListViewLockButton;
