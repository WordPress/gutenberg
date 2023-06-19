/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLink } from '../routes/link';

export default function TemplatePartNavigationMenuListItem( { id } ) {
	const [ title ] = useEntityProp( 'postType', 'wp_navigation', 'title', id );

	const linkInfo = useLink( {
		postId: id,
		postType: 'wp_navigation',
	} );

	if ( ! id ) return null;

	return (
		<SidebarNavigationItem withChevron { ...linkInfo }>
			{ title || __( '(no title)' ) }
		</SidebarNavigationItem>
	);
}
