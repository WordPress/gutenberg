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
			{ [ ...new Set( menus ) ].map( ( menuId, index ) => (
				<TemplatePartNavigationMenuListItem
					key={ index }
					id={ menuId }
				/>
			) ) }
		</ItemGroup>
	);
}
