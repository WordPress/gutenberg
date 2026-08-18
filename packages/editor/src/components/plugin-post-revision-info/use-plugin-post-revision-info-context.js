import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Selected revision context for PluginPostRevisionInfo.
 *
 * @return {Object} PluginPostRevisionInfoContext
 */
export default function usePluginPostRevisionInfoContext() {
	return useSelect( ( select ) => {
		const { getCurrentPostId, getCurrentPostType } = select( editorStore );
		const { getCurrentRevisionId, getCurrentRevision } = unlock(
			select( editorStore )
		);
		const postType = getCurrentPostType();

		return {
			revisionId: getCurrentRevisionId(),
			revision: getCurrentRevision() ?? null,
			revisionKey:
				select( coreStore ).getEntityConfig( 'postType', postType )
					?.revisionKey || 'id',
			postId: getCurrentPostId(),
			postType,
		};
	}, [] );
}
