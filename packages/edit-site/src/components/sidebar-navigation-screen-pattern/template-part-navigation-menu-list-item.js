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
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

export default function TemplatePartNavigationMenuListItem( { id } ) {
	const [ title ] = useEntityProp(
		'postType',
		NAVIGATION_POST_TYPE,
		'title',
		id
	);

	const linkInfo = useLink( {
		postId: id,
		postType: NAVIGATION_POST_TYPE,
	} );

	if ( ! id || title === undefined ) {
		return null;
	}

	return (
		<SidebarNavigationItem withChevron { ...linkInfo }>
			{ title || __( '(no title)' ) }
		</SidebarNavigationItem>
	);
}
