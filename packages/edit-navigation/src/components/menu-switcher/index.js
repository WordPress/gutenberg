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
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import AddMenu from '../add-menu';

export default function MenuSwitcher( {
	menus,
	selectedMenuId,
	onSelectMenu = noop,
} ) {
	const [ isModalVisible, setIsModalVisible ] = useState( false );
	const openModal = () => setIsModalVisible( true );
	const closeModal = () => setIsModalVisible( false );

	return (
		<>
			<MenuGroup>
				<MenuItemsChoice
					value={ selectedMenuId }
					onSelect={ onSelectMenu }
					choices={ menus.map( ( { id, name } ) => ( {
						value: id,
						label: decodeEntities( name ),
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
					className="edit-navigation-menu-switcher__new-button"
					onClick={ openModal }
				>
					{ __( 'Create a new menu' ) }
				</MenuItem>
				{ isModalVisible && (
					<Modal
						title={ __( 'Create a new menu' ) }
						className="edit-navigation-menu-switcher__modal"
						onRequestClose={ closeModal }
					>
						<AddMenu
							onCreate={ ( menuId ) => {
								closeModal();
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
