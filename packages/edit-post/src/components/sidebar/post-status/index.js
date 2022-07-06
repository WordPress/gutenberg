/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostStatusHeader from './header';
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
