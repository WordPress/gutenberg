import { useSelect } from '@wordpress/data';
import {
	ExternalLink,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import PostRevisionsTimeline from '../post-revisions-timeline';
import PostPanelSection from '../post-panel-section';
import PostCardPanel from '../post-card-panel';
import RevisionFieldsDiffPanel from '../revision-fields-diff';

export default function PostRevisionSummary() {
	const { revisionId, postId, isViewingBrowserBackup } = useSelect(
		( select ) => {
			const editor = unlock( select( editorStore ) );
			return {
				revisionId: editor.getCurrentRevisionId(),
				postId: editor.getCurrentPostId(),
				isViewingBrowserBackup: editor.isViewingBrowserBackup(),
			};
		},
		[]
	);
	if ( ! revisionId && ! isViewingBrowserBackup ) {
		return null;
	}
	return (
		<>
			<PostPanelSection className="editor-post-summary">
				<VStack spacing={ 4 }>
					<PostCardPanel postId={ postId } hideActions />
					{ ! isViewingBrowserBackup && (
						<ExternalLink
							href={ addQueryArgs( 'revision.php', {
								revision: revisionId,
							} ) }
						>
							{ __( 'Open classic revisions screen' ) }
						</ExternalLink>
					) }
				</VStack>
			</PostPanelSection>
			<RevisionFieldsDiffPanel />
			{ ! isViewingBrowserBackup && <PostRevisionsTimeline /> }
		</>
	);
}
