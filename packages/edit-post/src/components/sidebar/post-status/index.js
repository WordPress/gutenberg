/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	PanelBody,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	PluginPostStatusInfo,
	PostAuthorPanel,
	PostSchedulePanel,
	PostSyncStatus,
	PostURLPanel,
	PostTemplatePanel,
	PostFeaturedImagePanel,
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PostTrash from '../post-trash';
import PostSticky from '../post-sticky';
import PostSlug from '../post-slug';
import PostFormat from '../post-format';
import { unlock } from '../../../lock-unlock';

const {
	PostStatus: PostStatusPanel,
	PrivatePostExcerptPanel,
	PostContentInformation,
	PostLastEditedPanel,
} = unlock( editorPrivateApis );

/**
 * Module Constants
 */
const PANEL_NAME = 'post-status';

export default function PostStatus() {
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
			className="edit-post-post-status"
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
								<PrivatePostExcerptPanel />
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
						<PostSticky />
						<PostFormat />
						<PostSlug />
						<PostAuthorPanel />
						{ fills }
						<HStack
							style={ {
								marginTop: '16px',
							} }
						>
							<PostTrash />
						</HStack>
					</>
				) }
			</PluginPostStatusInfo.Slot>
		</PanelBody>
	);
}
