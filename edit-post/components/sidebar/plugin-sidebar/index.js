/**
 * WordPress dependencies
 */
import { Panel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withPluginContext } from '@wordpress/plugins';

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
function PluginSidebar( { children, name, pluginContext, title } ) {
	return (
		<Sidebar
			name={ `${ pluginContext.name }/${ name }` }
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
	);
}

export default withPluginContext( PluginSidebar );
