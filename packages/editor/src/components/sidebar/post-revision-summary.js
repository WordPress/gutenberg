/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __experimentalVStack as VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import RevisionAuthorPanel from '../revision-author-panel';
import RevisionCreatedPanel from '../revision-created-panel';
import { PostContentInformationUI } from '../post-content-information';
import RevisionFieldsDiffPanel from '../revision-fields-diff';
import PostPanelSection from '../post-panel-section';
import PostCardPanel from '../post-card-panel';
import { OpenRevisionsClassicScreen } from './post-summary';

export default function PostRevisionSummary() {
	const { revisionId, postId, postContent } = useSelect( ( select ) => {
		const { getCurrentRevisionId, getCurrentRevision, getCurrentPostId } =
			unlock( select( editorStore ) );
		const _revisionId = getCurrentRevisionId();
		return {
			revisionId: _revisionId,
			postId: getCurrentPostId(),
			postContent: _revisionId && getCurrentRevision()?.content?.raw,
		};
	}, [] );
	if ( ! revisionId ) {
		return null;
	}
	return (
		<>
			<PostPanelSection className="editor-post-summary">
				<VStack spacing={ 4 }>
					<PostCardPanel postId={ postId } hideActions />
					<VStack spacing={ 1 }>
						<PostContentInformationUI postContent={ postContent } />
						<RevisionCreatedPanel />
					</VStack>
					<OpenRevisionsClassicScreen revisionId={ revisionId } />
					<RevisionAuthorPanel />
				</VStack>
			</PostPanelSection>
			<RevisionFieldsDiffPanel />
		</>
	);
}
