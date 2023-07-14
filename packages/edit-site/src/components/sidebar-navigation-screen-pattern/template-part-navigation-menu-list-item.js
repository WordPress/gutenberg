/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLink } from '../routes/link';
import useEditedEntityRecord from '../use-edited-entity-record';

export default function TemplatePartNavigationMenuListItem( { id } ) {
	const { getTitle } = useEditedEntityRecord( 'wp_navigation', id );

	const linkInfo = useLink( {
		postId: id,
		postType: 'wp_navigation',
	} );

	if ( ! id ) return null;

	return (
		<SidebarNavigationItem withChevron { ...linkInfo }>
			{ getTitle() || __( '(no title)' ) }
		</SidebarNavigationItem>
	);
}
