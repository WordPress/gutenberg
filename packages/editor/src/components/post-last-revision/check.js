/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';
import { store as editorStore } from '../../store';

export function PostLastRevisionCheck( {
	lastRevisionId,
	revisionsCount,
	children,
} ) {
	if ( ! lastRevisionId || revisionsCount < 2 ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys="revisions">
			{ children }
		</PostTypeSupportCheck>
	);
}

export default withSelect( ( select ) => {
	const {
		getCurrentPostLastRevisionId,
		getCurrentPostRevisionsCount,
	} = select( editorStore );
	return {
		lastRevisionId: getCurrentPostLastRevisionId(),
		revisionsCount: getCurrentPostRevisionsCount(),
	};
} )( PostLastRevisionCheck );
