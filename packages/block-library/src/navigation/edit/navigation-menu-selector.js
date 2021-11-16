/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem, MenuItemsChoice } from '@wordpress/components';
import { useEntityId } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

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
					choices={ navigationMenus.map( ( { id, title } ) => {
						const label = decodeEntities( title.rendered );
						return {
							value: id,
							label,
							'aria-label': sprintf(
								/* translators: %s: The name of a menu. */
								__( "Switch to '%s'" ),
								label
							),
						};
					} ) }
				/>
			</MenuGroup>
			<MenuGroup>
				<MenuItem onClick={ onCreateNew }>
					{ __( 'Create new menu' ) }
				</MenuItem>
			</MenuGroup>
		</>
	);
}
