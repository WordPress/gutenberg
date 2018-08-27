/**
 * External dependencies
 */
import { find } from 'lodash-es';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import { visibilityOptions } from './utils';

function PostVisibilityLabel( { visibility } ) {
	const getVisibilityLabel = () => find( visibilityOptions, { value: visibility } ).label;

	return getVisibilityLabel( visibility );
}

export default withSelect( ( select ) => ( {
	visibility: select( 'core/editor' ).getEditedPostVisibility(),
} ) )( PostVisibilityLabel );
