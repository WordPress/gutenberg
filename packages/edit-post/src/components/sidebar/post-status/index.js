/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostStatusHeader from './header';
import PostFeaturedImage from '../post-featured-image';
import PostSummary from '../post-summary';
import PostVisibility from '../post-visibility';
import PostSchedule from '../post-schedule';
import PostAuthor from '../post-author';
import PostSlug from '../post-slug';
import PostFormat from '../post-format';
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
		<PanelBody className="edit-post-post-status">
			<PluginPostStatusInfo.Slot>
				{ ( fills ) => (
					<>
						<PostStatusHeader />
						<PostFeaturedImage />
						<PostSummary />
						<PostVisibility />
						<PostSchedule />
						<PostURL />
						<PostTemplate />
						<PostFormat />
						<PostSlug />
						<PostAuthor />
						{ fills }
					</>
				) }
			</PluginPostStatusInfo.Slot>
		</PanelBody>
	);
}
