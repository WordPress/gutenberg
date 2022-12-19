/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	__experimentalText as Text,
} from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import MenuSwitcher from '../menu-switcher';
import { useMenuEntityProp, useSelectedMenuId } from '../../hooks';

export default function MenuActions( { menus, isLoading } ) {
	const [ selectedMenuId, setSelectedMenuId ] = useSelectedMenuId();
	const [ menuName ] = useMenuEntityProp( 'name', selectedMenuId );

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );

	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			className: 'edit-navigation-menu-actions__switcher-dropdown',
			position: 'bottom center',
			// Use the title ref as the popover's anchor so that the dropdown is
			// centered over the whole title area rather than just on part of it.
			anchor: popoverAnchor,
		} ),
		[ popoverAnchor ]
	);

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
				ref={ setPopoverAnchor }
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
					popoverProps={ popoverProps }
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
