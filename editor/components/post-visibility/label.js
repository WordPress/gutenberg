/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { find } from 'lodash';

/**
 * Internal Dependencies
 */
import { getEditedPostVisibility } from '../../selectors';
import { visibilityOptions } from './utils';

function PostVisibilityLabel( { visibility } ) {
	const getVisibilityLabel = () => find( visibilityOptions, { value: visibility } ).label;

	return getVisibilityLabel( visibility );
}

export default connect(
	( state ) => ( {
		visibility: getEditedPostVisibility( state ),
	} ),
	undefined,
	undefined,
	{ storeKey: 'editorStore' }
)( PostVisibilityLabel );
