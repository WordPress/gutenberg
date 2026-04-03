/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	ExternalLink,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import DataFormPostSummary from './dataform-post-summary';
import PluginPostStatusInfo from '../plugin-post-status-info';
import PostAuthorPanel from '../post-author/panel';
import PostCardPanel from '../post-card-panel';
import PostContentInformation from '../post-content-information';
import PageAttributesPanel from '../page-attributes/panel';
import PostDiscussionPanel from '../post-discussion/panel';
import { PrivatePostExcerptPanel as PostExcerptPanel } from '../post-excerpt/panel';
import PostFeaturedImagePanel from '../post-featured-image/panel';
import PostFormatPanel from '../post-format/panel';
import PostLastEditedPanel from '../post-last-edited-panel';
import PostPanelSection from '../post-panel-section';
import PostSchedulePanel from '../post-schedule/panel';
import PostStatusPanel from '../post-status';
import PostSyncStatus from '../post-sync-status';
import PostTemplatePanel from '../post-template/panel';
import PostURLPanel from '../post-url/panel';
import BlogTitle from '../blog-title';
import PostsPerPage from '../posts-per-page';
import SiteDiscussion from '../site-discussion';
import { store as editorStore } from '../../store';
import { PrivatePostLastRevision } from '../post-last-revision';
import PostTrash from '../post-trash';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-status';

export function OpenRevisionsClassicScreen( { revisionId } ) {
	return (
		<ExternalLink
			href={ addQueryArgs( 'revision.php', {
				revision: revisionId,
			} ) }
		>
			{ __( 'Open classic revisions screen' ) }
		</ExternalLink>
	);
}

export default function PostSummary( { onActionPerformed } ) {
	const postType = useSelect(
		( select ) => select( editorStore ).getCurrentPostType(),
		[]
	);
	if (
		window?.__experimentalDataFormInspector &&
		[ 'page', 'post' ].includes( postType )
	) {
		return <DataFormPostSummary onActionPerformed={ onActionPerformed } />;
	}
	return <ClassicPostSummary onActionPerformed={ onActionPerformed } />;
}

function ClassicPostSummary( { onActionPerformed } ) {
	const { isRemovedPostStatusPanel, postType, postId } = useSelect(
		( select ) => {
			// We use isEditorPanelRemoved to hide the panel if it was programmatically removed. We do
			// not use isEditorPanelEnabled since this panel should not be disabled through the UI.
			const {
				isEditorPanelRemoved,
				getCurrentPostType,
				getCurrentPostId,
			} = select( editorStore );
			return {
				isRemovedPostStatusPanel: isEditorPanelRemoved( PANEL_NAME ),
				postType: getCurrentPostType(),
				postId: getCurrentPostId(),
			};
		},
		[]
	);
	return (
		<PostPanelSection className="editor-post-summary">
			<PluginPostStatusInfo.Slot>
				{ ( fills ) => (
					<>
						<VStack spacing={ 4 }>
							<PostCardPanel
								postType={ postType }
								postId={ postId }
								onActionPerformed={ onActionPerformed }
							/>
							<PostFeaturedImagePanel withPanelBody={ false } />
							<PostExcerptPanel />
							<VStack spacing={ 1 }>
								<PostContentInformation />
								<PostLastEditedPanel />
							</VStack>
							{ ! isRemovedPostStatusPanel && (
								<VStack spacing={ 4 }>
									<VStack spacing={ 1 }>
										<PostStatusPanel />
										<PostSchedulePanel />
										<PostURLPanel />
										<PostAuthorPanel />
										<PostTemplatePanel />
										<PostDiscussionPanel />
										<PrivatePostLastRevision />
										<PageAttributesPanel />
										<PostSyncStatus />
										<BlogTitle />
										<PostsPerPage />
										<SiteDiscussion />
										<PostFormatPanel />
										{ fills }
									</VStack>
									<PostTrash
										onActionPerformed={ onActionPerformed }
									/>
								</VStack>
							) }
						</VStack>
					</>
				) }
			</PluginPostStatusInfo.Slot>
		</PostPanelSection>
	);
}
