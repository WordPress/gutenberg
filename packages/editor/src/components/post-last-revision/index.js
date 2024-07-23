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
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';

function usePostLastRevisionInfo() {
	return useSelect( ( select ) => {
		const { getCurrentPostLastRevisionId, getCurrentPostRevisionsCount } =
			select( editorStore );
		return {
			lastRevisionId: getCurrentPostLastRevisionId(),
			revisionsCount: getCurrentPostRevisionsCount(),
		};
	}, [] );
}

/**
 * Renders the component for displaying the last revision of a post.
 *
 * @return {Component} The component to be rendered.
 */
function PostLastRevision() {
	const { lastRevisionId, revisionsCount } = usePostLastRevisionInfo();

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

export function PrivatePostLastRevision() {
	const { lastRevisionId, revisionsCount } = usePostLastRevisionInfo();
	return (
		<PostLastRevisionCheck>
			<PostPanelRow label={ __( 'Revisions' ) }>
				<Button
					href={ addQueryArgs( 'revision.php', {
						revision: lastRevisionId,
					} ) }
					className="editor-private-post-last-revision__button"
					text={ revisionsCount }
					variant="tertiary"
					size="compact"
				/>
			</PostPanelRow>
		</PostLastRevisionCheck>
	);
}

export default PostLastRevision;
