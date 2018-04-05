/**
 * WordPress dependencies
 */
import { Fill, Panel, Slot } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { PluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import SidebarHeader from '../sidebar/sidebar-header';

/**
 * Name of slot in which the sidebar should fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'PluginSidebar';

/**
 * Renders the plugin sidebar fill.
 *
 * @return {WPElement} Plugin sidebar fill.
 */
function PluginSidebar( { name, title, children } ) {
	return (
		<PluginContext.Consumer>
			{ ( { pluginName } ) => (
				<Fill name={ SLOT_NAME }>
					<Sidebar
						name={ [ pluginName, name ].join( '/' ) }
						label={ __( 'Editor plugins' ) }
					>
						<SidebarHeader
							closeLabel={ __( 'Close plugin' ) }
						>
							<strong>{ title }</strong>
						</SidebarHeader>
						<Panel>
							{ children }
						</Panel>
					</Sidebar>
				</Fill>
			) }
		</PluginContext.Consumer>
	);
}

/**
 * The plugin sidebar slot.
 *
 * @return {WPElement} The plugin sidebar slot.
 */
PluginSidebar.Slot = () => (
	<Slot name={ SLOT_NAME } />
);

export default PluginSidebar;
