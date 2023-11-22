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
	PostAuthorPanel,
	PostSchedulePanel,
	PostSwitchToDraftButton,
	PostSyncStatus,
	PostURLPanel,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PostVisibility from '../post-visibility';
import PostTrash from '../post-trash';
import PostSticky from '../post-sticky';
import PostSlug from '../post-slug';
import PostFormat from '../post-format';
import PostPendingStatus from '../post-pending-status';
import PluginPostStatusInfo from '../plugin-post-status-info';
import { store as editPostStore } from '../../../store';
import PostTemplate from '../post-template';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-status';

export default function PostStatus() {
	const { isOpened, isRemoved } = useSelect( ( select ) => {
		// We use isEditorPanelRemoved to hide the panel if it was programatically removed. We do
		// not use isEditorPanelEnabled since this panel should not be disabled through the UI.
		const { isEditorPanelRemoved, isEditorPanelOpened } =
			select( editPostStore );
		return {
			isRemoved: isEditorPanelRemoved( PANEL_NAME ),
			isOpened: isEditorPanelOpened( PANEL_NAME ),
		};
	}, [] );
	const { toggleEditorPanelOpened } = useDispatch( editPostStore );

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
						<PostVisibility />
						<PostSchedulePanel />
						<PostTemplate />
						<PostURLPanel />
						<PostSyncStatus />
						<PostSticky />
						<PostPendingStatus />
						<PostFormat />
						<PostSlug />
						<PostAuthorPanel />
						{ fills }
						<HStack
							style={ {
								marginTop: '16px',
							} }
							spacing={ 4 }
							wrap
						>
							<PostSwitchToDraftButton />
							<PostTrash />
						</HStack>
					</>
				) }
			</PluginPostStatusInfo.Slot>
		</PanelBody>
	);
}
