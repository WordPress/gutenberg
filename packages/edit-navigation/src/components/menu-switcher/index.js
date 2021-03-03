/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	MenuGroup,
	MenuItemsChoice,
	MenuItem,
	Modal,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AddMenu from '../add-menu';

export default function MenuSwitcher( {
	menus,
	selectedMenuId,
	onSelectMenu = noop,
} ) {
	const [ isAddNewMenuModalVisible, setIsAddNewModalVisible ] = useState(
		false
	);

	return (
		<>
			<MenuGroup>
				<MenuItemsChoice
					value={ selectedMenuId }
					onSelect={ ( menuId ) => {
						onSelectMenu( menuId );
					} }
					choices={ menus.map( ( { id, name } ) => ( {
						value: id,
						label: name,
						'aria-label': sprintf(
							/* translators: %s: The name of a menu. */
							__( "Switch to '%s'" ),
							name
						),
					} ) ) }
				/>
			</MenuGroup>
			<MenuGroup hideSeparator>
				<MenuItem
					isPrimary
					onClick={ () => setIsAddNewModalVisible( true ) }
				>
					{ __( 'Create a new menu' ) }
				</MenuItem>
				{ isAddNewMenuModalVisible && (
					<Modal
						title={ __( 'Create a new menu' ) }
						onRequestClose={ () =>
							setIsAddNewModalVisible( false )
						}
					>
						<AddMenu
							className="edit-navigation-menu-switcher__add-menu"
							menus={ menus }
							onCreate={ ( menuId ) => {
								setIsAddNewModalVisible( false );
								onSelectMenu( menuId );
							} }
							helpText={ __(
								'A short descriptive name for your menu.'
							) }
						/>
					</Modal>
				) }
			</MenuGroup>
		</>
	);
}
