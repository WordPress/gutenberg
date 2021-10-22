/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItemsChoice } from '@wordpress/components';
import { useEntityId } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';

export default function NavigationMenuSelector( { onSelect } ) {
	const { navigationMenus } = useNavigationMenu();
	const navigationMenuId = useEntityId( 'postType', 'wp_navigation' );

	return (
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
	);
}
