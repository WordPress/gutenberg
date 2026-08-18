import { __experimentalVStack as VStack } from '@wordpress/components';
import PostRevisionsTimeline from '../post-revisions-timeline';
import PostPanelSection from '../post-panel-section';
import PostCardPanel from '../post-card-panel';
import RevisionFieldsDiffPanel from '../revision-fields-diff';
import PluginPostRevisionInfo from '../plugin-post-revision-info';
import usePluginPostRevisionInfoContext from '../plugin-post-revision-info/use-plugin-post-revision-info-context';
import ClassicRevisionsLink from './classic-revisions-link';

export default function PostRevisionSummary() {
	const context = usePluginPostRevisionInfoContext();
	if ( ! context.revisionId ) {
		return null;
	}
	return (
		<>
			<PostPanelSection className="editor-post-summary">
				<VStack spacing={ 4 }>
					<PostCardPanel postId={ context.postId } hideActions />
					<PluginPostRevisionInfo.Slot fillProps={ { context } } />
				</VStack>
			</PostPanelSection>
			<RevisionFieldsDiffPanel />
			<PostRevisionsTimeline />
			<ClassicRevisionsLink />
		</>
	);
}
