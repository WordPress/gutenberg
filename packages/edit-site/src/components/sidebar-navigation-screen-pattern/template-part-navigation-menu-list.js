/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
/**
 * Internal dependencies
 */
import TemplatePartNavigationMenuListItem from './template-part-navigation-menu-list-item';

export default function TemplatePartNavigationMenuList( { menus } ) {
	return (
		<ItemGroup className="edit-site-sidebar-navigation-screen-template-part-navigation-menu-list">
			{ menus.map( ( menuId ) => (
				<TemplatePartNavigationMenuListItem
					key={ menuId }
					id={ menuId }
				/>
			) ) }
		</ItemGroup>
	);
}
