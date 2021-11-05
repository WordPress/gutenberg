/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem, MenuItemsChoice } from '@wordpress/components';
import { useEntityId } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';

export default function NavigationMenuSelector( { onSelect, onCreateNew } ) {
	const { navigationMenus } = useNavigationMenu();
	const navigationMenuId = useEntityId( 'postType', 'wp_navigation' );

	return (
		<>
			<MenuGroup>
				<MenuItemsChoice
					value={ navigationMenuId }
					onSelect={ ( selectedId ) =>
						onSelect(
							navigationMenus.find(
								( post ) => post.id === selectedId
							)
						)
					}
					choices={ navigationMenus.map( ( { id, title } ) => ( {
						value: id,
						label: title.rendered,
					} ) ) }
				/>
			</MenuGroup>
			<MenuGroup
				className="wp-navigation-block__create-new-menu-group"
				hideSeparator
			>
				<MenuItem
					className="wp-navigation-block__create-new-menu-button"
					onClick={ onCreateNew }
				>
					{ __( 'Create new menu' ) }
				</MenuItem>
			</MenuGroup>
		</>
	);
}
