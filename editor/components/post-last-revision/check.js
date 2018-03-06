/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getCurrentPostLastRevisionId, getCurrentPostRevisionsCount } from '../../store/selectors';
import PostTypeSupportCheck from '../post-type-support-check';

export function PostLastRevisionCheck( { lastRevisionId, revisionsCount, children } ) {
	if ( ! lastRevisionId || revisionsCount < 2 ) {
		return null;
	}

	return <PostTypeSupportCheck supportKeys="revisions" >{ children }</PostTypeSupportCheck>;
}

export default connect(
	( state ) => {
		return {
			lastRevisionId: getCurrentPostLastRevisionId( state ),
			revisionsCount: getCurrentPostRevisionsCount( state ),
		};
	}
)( PostLastRevisionCheck );
