/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	__experimentalText as Text,
} from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import { useCallback, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import MenuSwitcher from '../menu-switcher';
import { useMenuEntityProp, useSelectedMenuId } from '../../hooks';

export default function MenuActions( { menus, isLoading } ) {
	const [ selectedMenuId, setSelectedMenuId ] = useSelectedMenuId();
	const [ menuName ] = useMenuEntityProp( 'name', selectedMenuId );
	const [ popoverAnchor, setPopoverAnchor ] = useState();

	// The title ref is passed to the popover as the anchorRef so that the
	// dropdown is centered over the whole title area rather than just one
	// part of it.
	const titleCallbackRef = useCallback( ( node ) => {
		// The popover `anchor` prop can not be `null`.
		setPopoverAnchor( node ?? undefined );
	}, [] );

	if ( isLoading ) {
		return (
			<div className="edit-navigation-menu-actions">
				{ __( 'Loading…' ) }
			</div>
		);
	}

	return (
		<div className="edit-navigation-menu-actions">
			<div
				ref={ titleCallbackRef }
				className="edit-navigation-menu-actions__subtitle-wrapper"
			>
				<Text
					size="body"
					className="edit-navigation-menu-actions__subtitle"
					as="h2"
					limit={ 24 }
					ellipsizeMode="tail"
					truncate
				>
					{ decodeEntities( menuName ) }
				</Text>

				<DropdownMenu
					icon={ chevronDown }
					toggleProps={ {
						label: __( 'Switch menu' ),
						className:
							'edit-navigation-menu-actions__switcher-toggle',
						showTooltip: false,
						__experimentalIsFocusable: true,
					} }
					popoverProps={ {
						className:
							'edit-navigation-menu-actions__switcher-dropdown',
						position: 'bottom center',
						anchor: popoverAnchor,
					} }
				>
					{ ( { onClose } ) => (
						<MenuSwitcher
							menus={ menus }
							selectedMenuId={ selectedMenuId }
							onSelectMenu={ ( menuId ) => {
								setSelectedMenuId( menuId );
								onClose();
							} }
						/>
					) }
				</DropdownMenu>
			</div>
		</div>
	);
}
