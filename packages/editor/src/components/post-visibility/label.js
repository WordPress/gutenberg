/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

function PostVisibilityLabel( { postVisibility, statuses } ) {
	const statusVisibibilies = null !== statuses ? statuses.map( ( { visibility } ) => visibility ) : [];
	const getVisibilityLabel = () => {
		if ( ! statusVisibibilies.length ) {
			return '';
		}

		return find( statusVisibibilies, { value: postVisibility } ).label;
	};

	return getVisibilityLabel( postVisibility );
}

export default withSelect( ( select ) => ( {
	postVisibility: select( 'core/editor' ).getEditedPostVisibility(),
	statuses: select( 'core' ).getStatuses(),
} ) )( PostVisibilityLabel );
