/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalHeading as Heading } from '@wordpress/components';

/**
 * Internal dependencies
 */
import NavigationMenuEditor from '../sidebar-navigation-screen-navigation-menu/navigation-menu-editor';
import useNavigationMenuTitle from './use-navigation-menu-title';

export default function TemplatePartNavigationMenu( { id } ) {
	const title = useNavigationMenuTitle( id );

	if ( ! id || title === undefined ) {
		return null;
	}

	return (
		<>
			<Heading
				className="edit-site-sidebar-navigation-screen-template-part-navigation-menu__title"
				size="11"
				upperCase={ true }
				weight={ 500 }
			>
				{ title || __( 'Navigation' ) }
			</Heading>
			<NavigationMenuEditor navigationMenuId={ id } />
		</>
	);
}
