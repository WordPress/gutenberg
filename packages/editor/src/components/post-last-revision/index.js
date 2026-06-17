/**
 * WordPress dependencies
 */
import { sprintf, __, _n } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { backup } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import PostLastRevisionCheck from './check';
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function usePostLastRevisionInfo() {
	return useSelect( ( select ) => {
		const {
			getCurrentPostLastRevisionId,
			getCurrentPostRevisionsCount,
			getEditorSettings,
		} = select( editorStore );
		return {
			lastRevisionId: getCurrentPostLastRevisionId(),
			revisionsCount: getCurrentPostRevisionsCount(),
			disableVisualRevisions:
				!! getEditorSettings().disableVisualRevisions,
		};
	}, [] );
}

/**
 * Renders the component for displaying the last revision of a post.
 *
 * @return {React.ReactNode} The rendered component.
 */
function PostLastRevision() {
	const { lastRevisionId, revisionsCount, disableVisualRevisions } =
		usePostLastRevisionInfo();
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );

	const buttonProps = disableVisualRevisions
		? {
				href: addQueryArgs( 'revision.php', {
					revision: lastRevisionId,
				} ),
		  }
		: { onClick: () => setCurrentRevisionId( lastRevisionId ) };

	return (
		<PostLastRevisionCheck>
			<Button
				__next40pxDefaultSize
				{ ...buttonProps }
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
	const { lastRevisionId, revisionsCount, disableVisualRevisions } =
		usePostLastRevisionInfo();
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );

	const buttonProps = disableVisualRevisions
		? {
				href: addQueryArgs( 'revision.php', {
					revision: lastRevisionId,
				} ),
		  }
		: { onClick: () => setCurrentRevisionId( lastRevisionId ) };

	return (
		<PostLastRevisionCheck>
			<PostPanelRow label={ __( 'Revisions' ) }>
				<Button
					{ ...buttonProps }
					className="editor-private-post-last-revision__button"
					text={ revisionsCount }
					aria-label={ sprintf(
						/* translators: %d: number of revisions. */
						_n(
							'Open revisions screen: %d revision',
							'Open revisions screen: %d revisions',
							revisionsCount
						),
						revisionsCount
					) }
					variant="tertiary"
					size="compact"
				/>
			</PostPanelRow>
		</PostLastRevisionCheck>
	);
}

export default PostLastRevision;
