/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalHeading as Heading } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import NavigationMenuEditor from '../sidebar-navigation-screen-navigation-menu/navigation-menu-editor';
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

export default function TemplatePartNavigationMenu( { id } ) {
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
