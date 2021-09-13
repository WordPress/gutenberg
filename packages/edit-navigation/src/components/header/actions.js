/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
	__experimentalText as Text,
} from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import { useRef } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { useMenuEntityProp, useSelectedMenuId } from '../../hooks';

export default function HeaderActions( { menus, isLoading } ) {
	const [ selectedMenuId, setSelectedMenuId ] = useSelectedMenuId();
	const [ menuName ] = useMenuEntityProp( 'name', selectedMenuId );

	// The title ref is passed to the popover as the anchorRef so that the
	// dropdown is centered over the whole title area rather than just one
	// part of it.
	const titleRef = useRef();

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
				ref={ titleRef }
				className="edit-navigation-menu-actions__subtitle-wrapper"
			>
				<Text
					size="body"
					className="edit-navigation-menu-actions__subtitle"
					as="h2"
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
						anchorRef: titleRef.current,
					} }
				>
					{ ( { onClose } ) => (
						<MenuGroup>
							<MenuItemsChoice
								value={ selectedMenuId }
								choices={ menus.map( ( { id, name } ) => ( {
									value: id,
									label: decodeEntities( name ),
									'aria-label': sprintf(
										/* translators: %s: The name of a menu. */
										__( "Switch to '%s'" ),
										name
									),
								} ) ) }
								onSelect={ ( value ) => {
									setSelectedMenuId( value );
									onClose();
								} }
							/>
						</MenuGroup>
					) }
				</DropdownMenu>
			</div>
		</div>
	);
}
