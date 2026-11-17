import { __, sprintf } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import { lock, lockFilled } from '@wordpress/icons';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the Design System IconButton, which the lock design specifies.
	IconButton,
} from '@wordpress/ui';
import type { FocusEventHandler } from 'react';
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
 * unlocks the block and every block inside it.
 *
 * A block inside a layout-locked block is edited content only, so its lock is
 * managed from that ancestor: the button is disabled, but stays focusable so
 * its label can say why.
 */
const ListViewLockButton = forwardRef<
	HTMLButtonElement,
	ListViewLockButtonProps
>( function UnforwardedListViewLockButton(
	{ clientId, tabIndex, onFocus },
	ref
) {
	const { canLock, lockType, layoutLockedAncestor } =
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
	if ( layoutLockedAncestor ) {
		label = sprintf(
			/* translators: %s: The title of the parent block, e.g. "Group". */
			__( 'Locked by %s' ),
			ancestorTitle ?? ''
		);
	} else if ( ! canLock ) {
		label = __( 'Locked' );
	}

	return (
		<IconButton
			ref={ ref }
			className="block-editor-list-view-block__lock"
			variant="minimal"
			tone="neutral"
			size="small"
			icon={ lockType === 'full' ? lockFilled : lock }
			label={ label }
			disabled={ !! layoutLockedAncestor || ! canLock }
			tabIndex={ tabIndex }
			onFocus={ onFocus }
			onClick={ () => unlockBlocks( [ clientId ] ) }
		/>
	);
} );

export default ListViewLockButton;
