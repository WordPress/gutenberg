/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
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

const { PostStatus: PostStatusPanel } = unlock( editorPrivateApis );

/**
 * Module Constants
 */
const PANEL_NAME = 'post-status';

export default function PostStatus() {
	const { isOpened, isRemoved } = useSelect( ( select ) => {
		// We use isEditorPanelRemoved to hide the panel if it was programatically removed. We do
		// not use isEditorPanelEnabled since this panel should not be disabled through the UI.
		const { isEditorPanelRemoved, isEditorPanelOpened } =
			select( editorStore );
		return {
			isRemoved: isEditorPanelRemoved( PANEL_NAME ),
			isOpened: isEditorPanelOpened( PANEL_NAME ),
		};
	}, [] );
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
						<PostStatusPanel />
						<PostFeaturedImagePanel withPanelBody={ false } />
						<PostSchedulePanel />
						<PostTemplatePanel />
						<PostURLPanel />
						<PostSyncStatus />
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
