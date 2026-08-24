import { Link, Stack } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
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
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import { PrivatePostLastRevision } from '../post-last-revision';
import PostTrash from '../post-trash';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-status';

export default function PostSummary( { onActionPerformed } ) {
	const { isRemovedPostStatusPanel, postType, postId, showReadingSettings } =
		useSelect( ( select ) => {
			// We use isEditorPanelRemoved to hide the panel if it was programmatically removed. We do
			// not use isEditorPanelEnabled since this panel should not be disabled through the UI.
			const {
				isEditorPanelRemoved,
				getCurrentPostType,
				getCurrentPostId,
				getEditedPostAttribute,
			} = select( editorStore );
			const _postType = getCurrentPostType();
			return {
				isRemovedPostStatusPanel: isEditorPanelRemoved( PANEL_NAME ),
				postType: _postType,
				postId: getCurrentPostId(),
				// The Front Page template resolves to the site homepage whether
				// the homepage shows the latest posts or a static page, so point
				// at where that choice is made. The Reading settings screen needs
				// the `manage_options` capability, which maps onto updating the
				// site settings.
				showReadingSettings:
					_postType === TEMPLATE_POST_TYPE &&
					getEditedPostAttribute( 'slug' ) === 'front-page' &&
					!! select( coreStore ).canUser( 'update', {
						kind: 'root',
						name: 'site',
					} ),
			};
		}, [] );
	return (
		<PostPanelSection className="editor-post-summary">
			<PluginPostStatusInfo.Slot>
				{ ( fills ) => (
					<>
						<Stack direction="column" gap="lg">
							<PostCardPanel
								postType={ postType }
								postId={ postId }
								onActionPerformed={ onActionPerformed }
							/>
							<PostFeaturedImagePanel withPanelBody={ false } />
							<PostExcerptPanel />
							{ showReadingSettings && (
								// Wrapped so the link doesn't stretch to the
								// width of the column and make the whole row
								// clickable.
								<div className="editor-reading-settings-link">
									<Link href="options-reading.php">
										{ __( 'Reading settings' ) }
									</Link>
								</div>
							) }
							<Stack direction="column" gap="xs">
								<PostContentInformation />
								<PostLastEditedPanel />
							</Stack>
							{ ! isRemovedPostStatusPanel && (
								<Stack direction="column" gap="lg">
									<Stack direction="column" gap="xs">
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
									</Stack>
									<PostTrash
										onActionPerformed={ onActionPerformed }
									/>
								</Stack>
							) }
						</Stack>
					</>
				) }
			</PluginPostStatusInfo.Slot>
		</PostPanelSection>
	);
}
