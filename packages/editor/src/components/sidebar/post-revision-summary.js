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
import PostRevisionsTimeline from '../post-revisions-timeline';
import PostPanelSection from '../post-panel-section';
import PostCardPanel from '../post-card-panel';
import RevisionFieldsDiffPanel from '../revision-fields-diff';

export default function PostRevisionSummary() {
	const { revisionId, postId } = useSelect( ( select ) => {
		const { getCurrentRevisionId, getCurrentPostId } = unlock(
			select( editorStore )
		);
		return {
			revisionId: getCurrentRevisionId(),
			postId: getCurrentPostId(),
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
					<ExternalLink
						href={ addQueryArgs( 'revision.php', {
							revision: revisionId,
						} ) }
					>
						{ __( 'Open classic revisions screen' ) }
					</ExternalLink>
				</VStack>
			</PostPanelSection>
			<RevisionFieldsDiffPanel />
			<PostRevisionsTimeline />
		</>
	);
}
