/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import Panel from 'components/panel';
import PanelHeader from 'components/panel-header';
import IconButton from 'components/icon-button';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostStatus from '../post-status';

const PostSettings = ( { toggleSidebar } ) => {
	return (
		<Panel>
			<PanelHeader>
				<strong>{ __( 'Post Settings' ) }</strong>
				<div className="editor-sidebar-post-settings__icons">
					<IconButton icon="admin-settings" />
					<IconButton
						onClick={ toggleSidebar }
						icon="no-alt"
					/>
				</div>
			</PanelHeader>
			<PostStatus />
		</Panel>
	);
};

export default connect(
	undefined,
	( dispatch ) => ( {
		toggleSidebar: () => dispatch( { type: 'TOGGLE_SIDEBAR' } ),
	} )
)( PostSettings );
