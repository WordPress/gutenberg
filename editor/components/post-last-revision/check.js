/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getCurrentPostLastRevisionId, getCurrentPostRevisionsCount } from '../../selectors';

function PostLastRevisionCheck( { lastRevisionId, revisionsCount, children } ) {
	if ( ! lastRevisionId || revisionsCount < 2 ) {
		return null;
	}

	return children;
}

export default connect(
	( state ) => {
		return {
			lastRevisionId: getCurrentPostLastRevisionId( state ),
			revisionsCount: getCurrentPostRevisionsCount( state ),
		};
	}
)( PostLastRevisionCheck );
