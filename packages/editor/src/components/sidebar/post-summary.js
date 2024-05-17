/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PluginPostStatusInfo from '../plugin-post-status-info';
import PostActions from '../post-actions';
import PostAuthorPanel from '../post-author/panel';
import PostCardPanel from '../post-card-panel';
import PostContentInformation from '../post-content-information';
import PostDiscussionPanel from '../post-discussion/panel';
import { PrivatePostExcerptPanel as PostExcerptPanel } from '../post-excerpt/panel';
import PostFeaturedImagePanel from '../post-featured-image/panel';
import PostFormatPanel from '../post-format/panel';
import PostLastEditedPanel from '../post-last-edited-panel';
import PostPanelSection from '../post-panel-section';
import PostSchedulePanel from '../post-schedule/panel';
import PostStatusPanel from '../post-status';
import PostStickyPanel from '../post-sticky';
import PostSyncStatus from '../post-sync-status';
import PostTemplatePanel from '../post-template/panel';
import PostTrashPanel from '../post-trash/panel';
import PostURLPanel from '../post-url/panel';
import { store as editorStore } from '../../store';
import {
	NAVIGATION_POST_TYPE,
	PATTERN_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_POST_TYPE,
} from '../../store/constants';
import TemplateAreas from '../template-areas';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-status';

export default function PostSummary( { onActionPerformed } ) {
	const { isRemovedPostStatusPanel, postType } = useSelect( ( select ) => {
		// We use isEditorPanelRemoved to hide the panel if it was programatically removed. We do
		// not use isEditorPanelEnabled since this panel should not be disabled through the UI.
		const { isEditorPanelRemoved, getCurrentPostType } =
			select( editorStore );
		return {
			isRemovedPostStatusPanel: isEditorPanelRemoved( PANEL_NAME ),
			postType: getCurrentPostType(),
		};
	}, [] );
	const isPattern = postType === PATTERN_POST_TYPE;
	const isTemplate = postType === TEMPLATE_POST_TYPE;
	const isTemplatePart = postType === TEMPLATE_PART_POST_TYPE;
	const isNavigation = postType === NAVIGATION_POST_TYPE;

	return (
		<PostPanelSection className="editor-post-summary">
			<PluginPostStatusInfo.Slot>
				{ ( fills ) => (
					<>
						<VStack spacing={ 4 }>
							<PostCardPanel
								actions={
									<PostActions
										onActionPerformed={ onActionPerformed }
									/>
								}
							/>
							<PostFeaturedImagePanel withPanelBody={ false } />
							<PostExcerptPanel />
							<VStack spacing={ 1 }>
								<PostContentInformation />
								<PostLastEditedPanel />
							</VStack>
							{ ! isRemovedPostStatusPanel && (
								<VStack spacing={ 2 }>
									<VStack spacing={ 1 }>
										<PostStatusPanel />
										<PostSchedulePanel />
										<PostTemplatePanel />
										<PostURLPanel />
										<PostDiscussionPanel />
										<PostSyncStatus />
									</VStack>
									<PostStickyPanel />
									<PostFormatPanel />
									<PostAuthorPanel />
									{ isTemplate && <TemplateAreas /> }
									{ fills }
									{ ! isPattern &&
										! isTemplate &&
										! isTemplatePart &&
										! isNavigation && <PostTrashPanel /> }
								</VStack>
							) }
						</VStack>
					</>
				) }
			</PluginPostStatusInfo.Slot>
		</PostPanelSection>
	);
}
