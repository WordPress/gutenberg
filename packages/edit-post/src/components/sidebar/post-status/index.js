/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostFeaturedImage from '../post-featured-image';
import PostTitle from '../post-title';
import PostExcerpt from '../post-excerpt';
import PostVisibility from '../post-visibility';
import PostTrash from '../post-trash';
import PostSchedule from '../post-schedule';
import PostSticky from '../post-sticky';
import PostAuthor from '../post-author';
import PostSlug from '../post-slug';
import PostFormat from '../post-format';
import PostPendingStatus from '../post-pending-status';
import PluginPostStatusInfo from '../plugin-post-status-info';
import { store as editPostStore } from '../../../store';
import PostTemplate from '../post-template';
import PostURL from '../post-url';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-status';

export default function PostStatus() {
	// We use isEditorPanelRemoved to hide the panel if it was programatically
	// removed. We do not use isEditorPanelEnabled since this panel should not
	// be disabled through the UI.
	const isRemoved = useSelect(
		( select ) =>
			select( editPostStore ).isEditorPanelRemoved( PANEL_NAME ),
		[]
	);

	if ( isRemoved ) {
		return null;
	}

	return (
		<ToolsPanel className="edit-post-post-status" label={ __( 'Summary' ) }>
			<PluginPostStatusInfo.Slot>
				{ ( fills ) => (
					<>
						<PostFeaturedImage />
						<PostTitle />
						<PostExcerpt />
						<PostVisibility />
						<PostSchedule />
						<PostURL />
						<PostTemplate />
						<PostSticky />
						<PostPendingStatus />
						<PostFormat />
						<PostSlug />
						<PostAuthor />
						{ fills }
						<PostTrash />
					</>
				) }
			</PluginPostStatusInfo.Slot>
		</ToolsPanel>
	);
}
