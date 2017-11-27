/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal Dependencies
 */
import { getSelectedBlockCount } from '../../selectors';

const BlockCount = ( { count, children } ) => {
	return children( count );
};

export default connect(
	( state ) => ( {
		count: getSelectedBlockCount( state ),
	} ),
	undefined,
	undefined,
	{ storeKey: 'editorStore' }
)( BlockCount );
