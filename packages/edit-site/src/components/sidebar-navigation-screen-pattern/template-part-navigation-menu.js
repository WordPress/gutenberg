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
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

export default function TemplatePartNavigationMenu( { id } ) {
	const [ title ] = useEntityProp(
		'postType',
		NAVIGATION_POST_TYPE,
		'title',
		id
	);

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
