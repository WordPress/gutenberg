/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLink } from '../routes/link';
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

export default function TemplatePartNavigationMenuListItem( { id } ) {
	const title = useSelect(
		( select ) => {
			if ( ! id ) {
				return undefined;
			}

			const editedRecord = select( coreStore ).getEditedEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				id
			);

			// Do not display a 'trashed' navigation menu.
			return editedRecord.status === 'trash'
				? undefined
				: editedRecord.title;
		},
		[ id ]
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
