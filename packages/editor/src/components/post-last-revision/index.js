/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { backup } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import PostLastRevisionCheck from './check';
import { store as editorStore } from '../../store';

/**
 * Renders the component for displaying the last revision of a post.
 *
 * @return {Component} The component to be rendered.
 */
function PostLastRevision() {
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
				iconPosition="right"
				text={ sprintf(
					/* translators: %s: number of revisions */
					__( 'Revisions (%s)' ),
					revisionsCount
				) }
			/>
		</PostLastRevisionCheck>
	);
}

export default PostLastRevision;
