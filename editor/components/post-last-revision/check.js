/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ifPostTypeSupports from '../higher-order/if-post-type-supports';
import { getCurrentPostLastRevisionId, getCurrentPostRevisionsCount } from '../../store/selectors';

export function PostLastRevisionCheck( { lastRevisionId, revisionsCount, children } ) {
	if ( ! lastRevisionId || revisionsCount < 2 ) {
		return null;
	}

	return children;
}

const applyConnect = connect(
	( state ) => {
		return {
			lastRevisionId: getCurrentPostLastRevisionId( state ),
			revisionsCount: getCurrentPostRevisionsCount( state ),
		};
	}
);

export default compose( [
	ifPostTypeSupports( 'revisions' ),
	applyConnect,
] )( PostLastRevisionCheck );
