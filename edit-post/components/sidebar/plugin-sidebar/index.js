/**
 * WordPress dependencies
 */
import { Panel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { PluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import Sidebar from '../';
import SidebarHeader from '../sidebar-header';

/**
 * Renders the plugin sidebar component.
 *
 * @return {WPElement} Plugin sidebar component.
 */
function PluginSidebar( { name, title, children } ) {
	return (
		<PluginContext.Consumer>
			{ ( { pluginName } ) => (
				<Sidebar
					name={ `${ pluginName }/${ name }` }
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
			) }
		</PluginContext.Consumer>
	);
}

export default PluginSidebar;
