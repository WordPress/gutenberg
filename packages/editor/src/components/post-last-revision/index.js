/**
 * WordPress dependencies
 */
import { sprintf, _n } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { backup } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import PostLastRevisionCheck from './check';
import { store as editorStore } from '../../store';

function LastRevision() {
	const { lastRevisionId, revisionsCount } = useSelect( ( select ) => {
		const { getCurrentPostLastRevisionId, getCurrentPostRevisionsCount } =
			select( editorStore );
		return {
			lastRevisionId: getCurrentPostLastRevisionId(),
			revisionsCount: getCurrentPostRevisionsCount(),
		};
	}, [] );

	return (
		<PostLastRevisionCheck>
			<Button
				href={ addQueryArgs( 'revision.php', {
					revision: lastRevisionId,
				} ) }
				className="editor-post-last-revision__title"
				icon={ backup }
			>
				{ sprintf(
					/* translators: %d: number of revisions */
					_n( '%d Revision', '%d Revisions', revisionsCount ),
					revisionsCount
				) }
			</Button>
		</PostLastRevisionCheck>
	);
}

export default LastRevision;
