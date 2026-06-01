/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	ExternalLink,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

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
					<ExternalLink
						href={ addQueryArgs( 'revision.php', {
							revision: revisionId,
						} ) }
					>
						{ __( 'Open classic revisions screen' ) }
					</ExternalLink>
					<RevisionAuthorPanel />
				</VStack>
			</PostPanelSection>
			<RevisionFieldsDiffPanel />
		</>
	);
}
