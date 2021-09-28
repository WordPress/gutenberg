/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { visibilityOptions } from './utils';
import { store as editorStore } from '../../store';

function PostVisibilityLabel( { visibility } ) {
	const getVisibilityLabel = () =>
		find( visibilityOptions, { value: visibility } ).label;

	return getVisibilityLabel( visibility );
}

export default withSelect( ( select ) => ( {
	visibility: select( editorStore ).getEditedPostVisibility(),
} ) )( PostVisibilityLabel );
