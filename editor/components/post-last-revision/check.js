/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getCurrentPostLastRevisionId } from '../../state/selectors';

function PostLastRevisionCheck( { lastRevisionId, children } ) {
	if ( ! lastRevisionId ) {
		return null;
	}

	return children;
}

export default connect(
	( state ) => {
		return {
			lastRevisionId: getCurrentPostLastRevisionId( state ),
		};
	}
)( PostLastRevisionCheck );
