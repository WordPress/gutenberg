import { __, isRTL } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { chevronLeftSmall, chevronRightSmall } from '@wordpress/icons';
import {
	Icon,
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import type { KeyboardEvent } from 'react';
import BlockLockMenuItems from './lock-menu-items';
import type { BlockLockMenuProps } from './types';

/**
 * Renders the "Lock" item of the block settings menu, which opens the lock
 * options to its side.
 *
 * The block settings menu is a `DropdownMenu` from `@wordpress/components`,
 * which a `Menu` submenu from `@wordpress/ui` can't nest in. Until that menu
 * is migrated, the options open in their own `Menu`, anchored to the item and
 * portaled into the same popover so the settings menu stays open.
 */
export default function BlockLockSubmenu( { clientIds }: BlockLockMenuProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ item, setItem ] = useState< HTMLElement | null >( null );
	const container =
		item?.closest< HTMLElement >( '.components-popover' ) ?? undefined;
	const openKey = isRTL() ? 'ArrowLeft' : 'ArrowRight';
	const closeKey = isRTL() ? 'ArrowRight' : 'ArrowLeft';

	function close() {
		setIsOpen( false );
		item?.focus();
	}

	return (
		<>
			<MenuItem
				ref={ setItem }
				suffix={
					<Icon
						icon={ isRTL() ? chevronLeftSmall : chevronRightSmall }
					/>
				}
				aria-haspopup="menu"
				aria-expanded={ isOpen }
				onClick={ () => setIsOpen( ! isOpen ) }
				onKeyDown={ ( event: KeyboardEvent ) => {
					if ( event.key === openKey ) {
						event.preventDefault();
						event.stopPropagation();
						setIsOpen( true );
					}
				} }
			>
				{ __( 'Lock' ) }
			</MenuItem>
			<Menu.Root
				open={ isOpen }
				modal={ false }
				onOpenChange={ ( open, { reason, event } ) => {
					// A press on the item toggles the menu itself.
					if (
						reason === 'outside-press' &&
						item?.contains( event.target as Node )
					) {
						return;
					}
					setIsOpen( open );
				} }
			>
				<Menu.Popup
					portal={ <Menu.Portal container={ container } /> }
					positioner={
						<Menu.Positioner
							anchor={ item }
							side="inline-end"
							align="start"
							alignOffset={ -8 }
							sideOffset={ 8 }
						/>
					}
					onKeyDown={ ( event: KeyboardEvent ) => {
						// Keep the keys from also moving through, or closing,
						// the settings menu around it.
						event.stopPropagation();
						if (
							event.key === 'Escape' ||
							event.key === closeKey
						) {
							event.preventDefault();
							close();
						}
					} }
				>
					<BlockLockMenuItems clientIds={ clientIds } />
				</Menu.Popup>
			</Menu.Root>
		</>
	);
}
