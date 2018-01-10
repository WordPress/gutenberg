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
		return {
			title: __( 'Error: Unregistered plugin requested.' ),
			render: () => {
				return <Panel>
					<PanelBody>
						{ sprintf( __( 'No matching plugin sidebar found for plugin "%s"' ), plugin ) }
					</PanelBody>
				</Panel>;
			},
		};
	}
	return pluginSidebar;
}

function PluginsPanel( { onClose, plugin } ) {
	const {
		title,
		render,
	} = getPluginSidebar( plugin );
	return (
		<div
			className="editor-sidebar"
			role="region"
			aria-label={ __( 'Editor plugins' ) }
			tabIndex="-1">
			<div className="components-panel__header editor-sidebar__panel-tabs">
				<h3>{ title }</h3>
				<IconButton
					onClick={ onClose }
					icon="no-alt"
					label={ __( 'Close settings' ) }
				/>
			</div>
			<div className="editor-plugins-panel__content">
				{ render() }
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
