import { __, sprintf } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import { lock, lockFilled } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import type { FocusEventHandler, MouseEvent } from 'react';
import { useBlockLock, useUnlockBlocks } from '../block-lock';
import { store as blockEditorStore } from '../../store';

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
 * a pattern, which is edited content only. A block inside any other locked
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
	// The block type, e.g. "Group", rather than any custom name of the block.
	const blockTypeTitle = useSelect(
		( select ) => {
			const blockName =
				select( blockEditorStore ).getBlockName( clientId );
			return blockName
				? select( blocksStore ).getBlockType( blockName )?.title
				: undefined;
		},
		[ clientId ]
	);
	const unlockBlocks = useUnlockBlocks();

	let label: string = sprintf(
		/* translators: %s: The name of the block type, e.g. "Group". */
		__( 'Unlock %s' ),
		blockTypeTitle ?? ''
	);
	// A pattern, and every block inside it, is locked by the pattern.
	if ( isPatternLocked || lockingSection ) {
		label = __( 'Locked by Pattern' );
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
			disabled={ isPatternLocked || !! lockingSection || ! canLock }
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
