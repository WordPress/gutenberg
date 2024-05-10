/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	PanelBody,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PluginPostStatusInfo from '../plugin-post-status-info';
import PostAuthorPanel from '../post-author/panel';
import PostContentInformation from '../post-content-information';
import { PrivatePostExcerptPanel as PostExcerptPanel } from '../post-excerpt/panel';
import PostFeaturedImagePanel from '../post-featured-image/panel';
import PostFormatPanel from '../post-format/panel';
import PostLastEditedPanel from '../post-last-edited-panel';
import PostSchedulePanel from '../post-schedule/panel';
import PostSlugPanel from '../post-slug/panel';
import PostStatusPanel from '../post-status';
import PostStickyPanel from '../post-sticky';
import PostSyncStatus from '../post-sync-status';
import PostTemplatePanel from '../post-template/panel';
import PostURLPanel from '../post-url/panel';
import { store as editorStore } from '../../store';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-status';

export default function PostSummary() {
	const { isOpened, isRemoved, showPostContentPanels } = useSelect(
		( select ) => {
			// We use isEditorPanelRemoved to hide the panel if it was programatically removed. We do
			// not use isEditorPanelEnabled since this panel should not be disabled through the UI.
			const {
				isEditorPanelRemoved,
				isEditorPanelOpened,
				getCurrentPostType,
			} = select( editorStore );
			const postType = getCurrentPostType();
			return {
				isRemoved: isEditorPanelRemoved( PANEL_NAME ),
				isOpened: isEditorPanelOpened( PANEL_NAME ),
				// Post excerpt panel is rendered in different place depending on the post type.
				// So we cannot make this check inside the PostExcerpt component based on the current edited entity.
				showPostContentPanels: ! [
					'wp_template',
					'wp_template_part',
					'wp_block',
				].includes( postType ),
			};
		},
		[]
	);
	const { toggleEditorPanelOpened } = useDispatch( editorStore );

	if ( isRemoved ) {
		return null;
	}

	return (
		<PanelBody
			title={ __( 'Summary' ) }
			opened={ isOpened }
			onToggle={ () => toggleEditorPanelOpened( PANEL_NAME ) }
		>
			<PluginPostStatusInfo.Slot>
				{ ( fills ) => (
					<>
						{ showPostContentPanels && (
							<VStack
								spacing={ 3 }
								//  TODO: this needs to be consolidated with the panel in site editor, when we unify them.
								style={ { marginBlockEnd: '24px' } }
							>
								<PostFeaturedImagePanel
									withPanelBody={ false }
								/>
								<PostExcerptPanel />
								<VStack spacing={ 1 }>
									<PostContentInformation />
									<PostLastEditedPanel />
								</VStack>
							</VStack>
						) }
						<VStack
							spacing={ 1 }
							style={ { marginBlockEnd: '12px' } }
						>
							<PostStatusPanel />
							<PostSchedulePanel />
							<PostTemplatePanel />
							<PostURLPanel />
							<PostSyncStatus />
						</VStack>
						<PostStickyPanel />
						<PostFormatPanel />
						<PostSlugPanel />
						<PostAuthorPanel />
						{ fills }
					</>
				) }
			</PluginPostStatusInfo.Slot>
		</PanelBody>
	);
}
