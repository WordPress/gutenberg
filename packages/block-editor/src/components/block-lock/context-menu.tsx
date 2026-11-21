import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import type { KeyboardEvent, MouseEvent } from 'react';
import BlockLockMenuItems from './lock-menu-items';

interface BlockLockContextMenuProps {
	/**
	 * The client IDs of the blocks whose lock the menu changes.
	 */
	clientIds: string[];
	/**
	 * Where the menu opens, or `null` while it is closed.
	 */
	anchorRect: DOMRect | null;
	/**
	 * The element the menu opens from, which gets focus back on close.
	 */
	contextElement: HTMLElement | null;
	/**
	 * Called when the menu closes.
	 */
	onClose: () => void;
}

/**
 * Returns where a context menu opens for a `contextmenu` event: at the
 * pointer, or below the element for the context menu key, which gives no
 * pointer position.
 *
 * @param event The `contextmenu` event.
 *
 * @return The rectangle to anchor the menu to.
 */
export function getContextMenuAnchorRect(
	event: MouseEvent< HTMLElement >
): DOMRect {
	if ( event.clientX === 0 && event.clientY === 0 ) {
		const rect = event.currentTarget.getBoundingClientRect();
		return new window.DOMRect( rect.left, rect.bottom, 0, 0 );
	}
	return new window.DOMRect( event.clientX, event.clientY, 0, 0 );
}

/**
 * Renders the lock menu that opens from a right-click on a lock button.
 */
export default function BlockLockContextMenu( {
	clientIds,
	anchorRect,
	contextElement,
	onClose,
}: BlockLockContextMenuProps ) {
	return (
		<Menu.Root
			open={ !! anchorRect }
			onOpenChange={ ( nextOpen ) => {
				if ( nextOpen ) {
					return;
				}
				onClose();
				contextElement?.focus();
			} }
		>
			<Menu.Popup
				// The popup is portaled, but its events still bubble to the
				// List View row or the toolbar, whose keys move focus.
				onKeyDown={ ( event: KeyboardEvent ) =>
					event.stopPropagation()
				}
				positioner={
					<Menu.Positioner
						anchor={ {
							contextElement: contextElement ?? undefined,
							getBoundingClientRect: () =>
								anchorRect ?? new window.DOMRect(),
						} }
						side="bottom"
						align="start"
					/>
				}
			>
				<BlockLockMenuItems clientIds={ clientIds } />
			</Menu.Popup>
		</Menu.Root>
	);
}
