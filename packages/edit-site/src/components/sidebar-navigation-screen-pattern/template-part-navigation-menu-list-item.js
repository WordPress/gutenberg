/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import useNavigationMenuTitle from './use-navigation-menu-title';
import { useLink } from '../routes/link';
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

export default function TemplatePartNavigationMenuListItem( { id } ) {
	const title = useNavigationMenuTitle( id );

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
