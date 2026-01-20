/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { backup } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PostLastRevisionCheck from './check';
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

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
 * @return {React.ReactNode} The rendered component.
 */
function PostLastRevision() {
	const { lastRevisionId, revisionsCount } = usePostLastRevisionInfo();
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );

	return (
		<PostLastRevisionCheck>
			<Button
				__next40pxDefaultSize
				onClick={ () => setCurrentRevisionId( lastRevisionId ) }
				className="editor-post-last-revision__title"
				icon={ backup }
				iconPosition="right"
				text={ sprintf(
					/* translators: %s: number of revisions. */
					__( 'Revisions (%s)' ),
					revisionsCount
				) }
			/>
		</PostLastRevisionCheck>
	);
}

export function PrivatePostLastRevision() {
	const { lastRevisionId, revisionsCount } = usePostLastRevisionInfo();
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );

	return (
		<PostLastRevisionCheck>
			<PostPanelRow label={ __( 'Revisions' ) }>
				<Button
					onClick={ () => setCurrentRevisionId( lastRevisionId ) }
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
