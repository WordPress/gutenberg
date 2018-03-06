/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { withFocusReturn } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostSettings from './post-settings';
import BlockInspectorPanel from './block-inspector-panel';
import Header from './header';
import { getActiveGeneralSidebarName } from '../../store/selectors';

/**
 * Renders a sidebar with the relevant panel.
 *
 * @param {string} panel The currently active panel.
 *
 * @return {Object} The rendered sidebar.
 */
const Sidebar = ( { activeSidebarName } ) => {
	return (
		<div
			className="edit-post-sidebar"
			role="region"
			aria-label={ __( 'Editor advanced settings' ) }
			tabIndex="-1"
		>
			<Header />
			{ activeSidebarName === 'edit-post/block' ?
				<BlockInspectorPanel /> :
				<PostSettings />
			}
		</div>
	);
};

export default connect(
	( state ) => {
		return {
			activeSidebarName: getActiveGeneralSidebarName( state ),
		};
	},
	undefined,
	undefined,
	{ storeKey: 'edit-post' }
)( withFocusReturn( Sidebar ) );
