/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

export default function useNavigationMenuTitle( id ) {
	return useSelect(
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
}
