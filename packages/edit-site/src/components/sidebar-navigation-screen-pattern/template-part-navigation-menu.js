/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalHeading as Heading } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import NavigationMenuEditor from '../sidebar-navigation-screen-navigation-menu/navigation-menu-editor';

export default function TemplatePartNavigationMenu( { id } ) {
	const [ title ] = useEntityProp( 'postType', 'wp_navigation', 'title', id );

	if ( ! id ) return null;

	return (
		<>
			<Heading
				className="edit-site-sidebar-navigation-screen-template-part-navigation-menu__title"
				size="12"
				upperCase={ true }
			>
				{ title?.rendered || __( 'Navigation' ) }
			</Heading>
			<NavigationMenuEditor navigationMenuId={ id } />
		</>
	);
}
