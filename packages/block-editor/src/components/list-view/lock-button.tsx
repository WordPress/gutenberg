import { __, sprintf } from '@wordpress/i18n';
import { forwardRef, useRef, useState } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { lock, lockDashed, lockOpen } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import type { FocusEventHandler, KeyboardEvent, MouseEvent } from 'react';
import {
	BlockLockMenuItems,
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
 * - An unlocked block shows an open lock while the row is hovered, focused or
 *   selected. Pressing it locks every property of the block and every block
 *   inside it.
 * - A locked block always shows its lock: a lock for a full lock and a lock
 *   with a dash for a partial lock. Pressing it unlocks the block and every
 *   block inside it.
 * - Right-clicking the lock of a locked block or a pattern opens the lock menu
 *   at the pointer, to change each property.
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
	const lockBlocks = useLockBlocks();
	const unlockBlocks = useUnlockBlocks();
	const buttonRef = useRef< HTMLButtonElement >( null );
	const mergedRef = useMergeRefs( [ ref, buttonRef ] );
	// Where the lock menu opens, set when the button is right-clicked.
	const [ menuAnchorRect, setMenuAnchorRect ] = useState< DOMRect | null >(
		null
	);

	const isLocked = lockType !== 'none';
	const isInPattern = isPatternLocked || !! lockingSection;
	const isDisabled = isInPattern || ! canLock;
	// The lock menu changes the lock of a locked block or of a pattern, but
	// not of a block inside a pattern, whose lock is the pattern's.
	const hasMenu =
		canLock && ! lockingSection && ( isLocked || isPatternLocked );

	let icon = lockOpen;
	if ( lockType === 'full' ) {
		icon = lock;
	} else if ( lockType === 'partial' ) {
		icon = lockDashed;
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
	// A pattern, and every block inside it, is locked by the pattern.
	if ( isInPattern ) {
		label = __( 'Locked by Pattern' );
	} else if ( ! canLock ) {
		label = __( 'Locked' );
	}

	return (
		<>
			<Button
				ref={ mergedRef }
				className="block-editor-list-view-block__lock"
				size="small"
				icon={ icon }
				label={ label }
				disabled={ isDisabled }
				accessibleWhenDisabled
				tabIndex={ tabIndex }
				onFocus={ onFocus }
				aria-haspopup={ hasMenu ? 'menu' : undefined }
				aria-expanded={ hasMenu ? !! menuAnchorRect : undefined }
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
					const buttonRect =
						event.currentTarget.getBoundingClientRect();
					// The context menu key gives no pointer position, so open
					// the menu below the button.
					const isFromKeyboard =
						event.clientX === 0 && event.clientY === 0;
					setMenuAnchorRect(
						isFromKeyboard
							? new window.DOMRect(
									buttonRect.left,
									buttonRect.bottom,
									0,
									0
								)
							: new window.DOMRect(
									event.clientX,
									event.clientY,
									0,
									0
								)
					);
				} }
			/>
			{ hasMenu && (
				<Menu.Root
					open={ !! menuAnchorRect }
					onOpenChange={ ( nextOpen ) => {
						if ( nextOpen ) {
							return;
						}
						setMenuAnchorRect( null );
						buttonRef.current?.focus();
					} }
				>
					<Menu.Popup
						// The popup is portaled, but its events still bubble
						// to the row, whose keys move through List View.
						onKeyDown={ ( event: KeyboardEvent ) =>
							event.stopPropagation()
						}
						positioner={
							<Menu.Positioner
								anchor={ {
									contextElement:
										buttonRef.current ?? undefined,
									getBoundingClientRect: () =>
										menuAnchorRect ?? new window.DOMRect(),
								} }
								side="bottom"
								align="start"
							/>
						}
					>
						<BlockLockMenuItems clientIds={ [ clientId ] } />
					</Menu.Popup>
				</Menu.Root>
			) }
		</>
	);
} );

export default ListViewLockButton;
