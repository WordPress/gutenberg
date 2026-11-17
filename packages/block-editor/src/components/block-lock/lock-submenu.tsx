import { __, isRTL } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { chevronLeftSmall, chevronRightSmall } from '@wordpress/icons';
import {
	Icon,
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import type { KeyboardEvent, MouseEvent } from 'react';
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
	// Opening from the keyboard moves focus to the first option, as a
	// submenu does; opening with a pointer leaves it on the item.
	const [ shouldFocusFirstItem, setShouldFocusFirstItem ] = useState( false );
	const [ item, setItem ] = useState< HTMLElement | null >( null );
	const popupRef = useRef< HTMLDivElement >( null );
	const container =
		item?.closest< HTMLElement >( '.components-popover' ) ?? undefined;
	const openKey = isRTL() ? 'ArrowLeft' : 'ArrowRight';
	const closeKey = isRTL() ? 'ArrowRight' : 'ArrowLeft';

	function open( { withKeyboard }: { withKeyboard: boolean } ) {
		setIsOpen( true );
		setShouldFocusFirstItem( withKeyboard );
	}

	function close() {
		setIsOpen( false );
		item?.focus();
	}

	// The settings menu stops arrow keys natively on its container, before
	// React sees them, so listen on the item itself to open with the keyboard.
	useEffect( () => {
		if ( ! item ) {
			return;
		}

		const onItemKeyDown = ( event: globalThis.KeyboardEvent ) => {
			if ( event.key !== openKey ) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			setIsOpen( true );
			setShouldFocusFirstItem( true );
		};
		item.addEventListener( 'keydown', onItemKeyDown );

		return () => item.removeEventListener( 'keydown', onItemKeyDown );
	}, [ item, openKey ] );

	useEffect( () => {
		if ( ! isOpen || ! shouldFocusFirstItem ) {
			return;
		}

		// The popup mounts in a portal, so wait for its first option.
		let frame: number;
		const focusFirstItem = () => {
			const firstItem = popupRef.current?.querySelector< HTMLElement >(
				'[role^="menuitem"]:not([aria-disabled="true"])'
			);
			if ( ! firstItem ) {
				frame = window.requestAnimationFrame( focusFirstItem );
				return;
			}
			firstItem.focus();
			setShouldFocusFirstItem( false );
		};
		frame = window.requestAnimationFrame( focusFirstItem );

		return () => window.cancelAnimationFrame( frame );
	}, [ isOpen, shouldFocusFirstItem ] );

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
				onClick={ ( event: MouseEvent ) => {
					if ( isOpen ) {
						setIsOpen( false );
						return;
					}
					// Enter and Space press the item with a click of no detail.
					open( { withKeyboard: event.detail === 0 } );
				} }
			>
				{ __( 'Lock' ) }
			</MenuItem>
			<Menu.Root
				open={ isOpen }
				modal={ false }
				onOpenChange={ ( nextOpen, { reason, event } ) => {
					// A press on the item toggles the menu itself.
					if (
						reason === 'outside-press' &&
						item?.contains( event.target as Node )
					) {
						return;
					}
					setIsOpen( nextOpen );
				} }
			>
				<Menu.Popup
					ref={ popupRef }
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
