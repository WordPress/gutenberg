/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalHeading as Heading } from '@wordpress/components';
/**
 * Internal dependencies
 */
import TemplatePartNavigationMenu from './template-part-navigation-menu';
import TemplatePartNavigationMenuList from './template-part-navigation-menu-list';

export default function TemplatePartNavigationMenus( { menus } ) {
	if ( ! menus.length ) return null;

	// if there is a single menu then render TemplatePartNavigationMenu
	if ( menus.length === 1 ) {
		return <TemplatePartNavigationMenu id={ menus[ 0 ] } />;
	}

	// if there are multiple menus then render TemplatePartNavigationMenuList
	return (
		<>
			<Heading
				className="edit-site-sidebar-navigation-screen-template-part-navigation-menu__title"
				size="12"
				upperCase={ true }
			>
				{ __( 'Navigation' ) }
			</Heading>
			<TemplatePartNavigationMenuList menus={ menus } />
		</>
	);
}
