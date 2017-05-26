/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Panel, PanelHeader, IconButton } from 'components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostStatus from '../post-status';
import PostExcerpt from '../post-excerpt';
import FeaturedImage from '../featured-image';
import DiscussionPanel from '../discussion-panel';
import LastRevision from '../last-revision';

const PostSettings = ( { toggleSidebar } ) => {
	return (
		<Panel>
			<PanelHeader label={ __( 'Post Settings' ) } >
				<div className="editor-sidebar-post-settings__icons">
					<IconButton icon="admin-settings" />
					<IconButton
						onClick={ toggleSidebar }
						icon="no-alt"
					/>
				</div>
			</PanelHeader>
			<PostStatus />
			<LastRevision />
			<FeaturedImage />
			<PostExcerpt />
			<DiscussionPanel />
		</Panel>
	);
};

export default connect(
	undefined,
	( dispatch ) => ( {
		toggleSidebar: () => dispatch( { type: 'TOGGLE_SIDEBAR' } ),
	} )
)( PostSettings );
