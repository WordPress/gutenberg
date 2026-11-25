import clsx from 'clsx';
import { __, sprintf } from '@wordpress/i18n';
import { forwardRef, useRef, useState } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { lock, lockDashed, lockOpen } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import type { FocusEventHandler, MouseEvent } from 'react';
import {
	BlockLockContextMenu,
	getContextMenuAnchorRect,
	useBlockLock,
	useLockBlocks,
	useUnlockBlocks,
} from '../block-lock';
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
 * Renders the lock of a block in its List View row. It is the same button as
 * the row's options menu toggle, so the two look alike.
 *
 * - An unlocked block or pattern shows an open lock while the pointer is over
 *   the row, or the button has keyboard focus. Pressing it locks every
 *   property of the block and every block inside it.
 * - A locked block or pattern always shows its lock: a lock for a full lock
 *   and a lock with a dash for a partial lock. Pressing it unlocks the block
 *   and every block inside it.
 * - Right-clicking the lock, locked or not, opens the lock menu at the
 *   pointer, to change each property.
 *
 * A pattern's layout is the pattern's, so it neither counts as a lock here nor
 * changes. A block inside a pattern is edited content only, so it shows a
 * partial lock. Its button is disabled, but stays focusable so its label can
 * say why. A block inside any
 * other locked block controls its own lock, so its button works.
 */
const ListViewLockButton = forwardRef<
	HTMLButtonElement,
	ListViewLockButtonProps
>( function UnforwardedListViewLockButton(
	{ clientId, tabIndex, onFocus },
	ref
) {
	const { canLock, hasOwnLock, lockType, lockingSection, isPatternLocked } =
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
	const lockBlocks = useLockBlocks();
	const unlockBlocks = useUnlockBlocks();
	const buttonRef = useRef< HTMLButtonElement >( null );
	const mergedRef = useMergeRefs( [ ref, buttonRef ] );
	// Where the lock menu opens, set when the button is right-clicked.
	const [ menuAnchorRect, setMenuAnchorRect ] = useState< DOMRect | null >(
		null
	);

	const isLocked = hasOwnLock;
	const isDisabled = !! lockingSection || ! canLock;
	// The lock menu changes the lock of a block or pattern, locked or not, but
	// not of a block inside a pattern, whose lock is the pattern's.
	const hasMenu = canLock && ! lockingSection;
	let icon = lockOpen;
	// A block inside a pattern is partly locked by the pattern, whose content
	// stays editable, unless its own lock is full.
	if ( isLocked || lockingSection ) {
		icon = lockType === 'full' ? lock : lockDashed;
	}

	let label: string = isLocked
		? sprintf(
				/* translators: %s: The name of the block type, e.g. "Group". */
				__( 'Unlock %s' ),
				blockTypeTitle ?? ''
			)
		: sprintf(
				/* translators: %s: The name of the block type, e.g. "Group". */
				__( 'Lock %s' ),
				blockTypeTitle ?? ''
			);
	if ( isPatternLocked ) {
		label = isLocked ? __( 'Unlock Pattern' ) : __( 'Lock Pattern' );
	}
	// Every block inside a pattern is locked by the pattern.
	if ( lockingSection ) {
		label = __( 'Locked by Pattern' );
	} else if ( ! canLock ) {
		label = __( 'Locked' );
	}

	return (
		<>
			<Button
				ref={ mergedRef }
				className={ clsx( 'block-editor-list-view-block__lock', {
					'is-menu-open': !! menuAnchorRect,
				} ) }
				size="small"
				icon={ icon }
				label={ label }
				disabled={ isDisabled }
				accessibleWhenDisabled
				tabIndex={ tabIndex }
				onFocus={ onFocus }
				onClick={ () => {
					if ( isLocked ) {
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
					contextElement={ buttonRef.current }
					onClose={ () => setMenuAnchorRect( null ) }
				/>
			) }
		</>
	);
} );

export default ListViewLockButton;
