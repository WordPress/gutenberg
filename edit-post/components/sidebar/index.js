/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { withFocusReturn } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostSettings from './post-settings';
import BlockInspectorPanel from './block-inspector-panel';
import SettingsHeader from './header';

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
			<SettingsHeader activeSidebarName={ activeSidebarName } />
			{ activeSidebarName === 'edit-post/block' ?
				<BlockInspectorPanel /> :
				<PostSettings />
			}
		</div>
	);
};

export default compose(
	withSelect( ( select ) => ( {
		activeSidebarName: select( 'core/edit-post' ).getActiveGeneralSidebarName(),
	} ) ),
	withFocusReturn,
)( Sidebar );
