/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { compose } from '@wordpress/element';
import { Panel, PanelBody, IconButton, withFocusReturn } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getSidebar } from '../../api/sidebar';
import { getActivePlugin } from '../../store/selectors';
import { closeGeneralSidebar } from '../../store/actions';

/**
 * Returns the sidebar that should be rendered in the sidebar registered by
 * plugins.
 *
 * @param {string} plugin The currently active plugin.
 *
 * @returns {Object} The React element to render as a panel.
 */
function getPluginSidebar( plugin ) {
	const pluginSidebar = getSidebar( plugin );

	if ( ! pluginSidebar ) {
		return () => {
			return <Panel>
				<PanelBody>
					{ sprintf( __( 'No matching plugin sidebar found for plugin "%s"' ), plugin ) }
				</PanelBody>
			</Panel>;
		};
	}

	return pluginSidebar.render;
}

function PluginsPanel( { onClose, plugin } ) {
	return (
		<div 
			className="editor-sidebar"
			role="region"
			aria-label={ __( 'Editor plugins' ) }
			tabIndex="-1">
			<div className="components-panel__header editor-sidebar__panel-tabs">
				<IconButton
					onClick={ onClose }
					icon="no-alt"
					label={ __( 'Close settings' ) }
				/>
			</div>
			<div className="editor-plugins-panel__content">
				{ getPluginSidebar( plugin )() }
			</div>
		</div>
	);
}

export default connect(
	( state ) => {
		return {
			plugin: getActivePlugin( state ),
		};
	}, {
		onClose: closeGeneralSidebar,
	}
)( withFocusReturn( PluginsPanel ) );
