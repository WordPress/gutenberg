/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PluginContextProvider from '../plugin-context-provider';

/**
 * A component that renders all plugin fills in a hidden div.
 *
 * @return {WPElement} Plugin area.
 */
function PluginArea( { plugins } ) {
	return (
		<div style={ { display: 'none' } }>
			{ map( plugins, ( plugin ) => {
				const { render: Plugin } = plugin;

				return (
					<PluginContextProvider
						key={ plugin.name }
						pluginName={ plugin.name }
					>
						<Plugin />
					</PluginContextProvider>
				);
			} ) }
		</div>
	);
}

/**
 * Using withSelect instead of internal ./api/index.getPlugins() to force rerender
 * when a new plugin is registered.
 */
export default withSelect( select => ( {
	plugins: select( 'core/plugins' ).getPlugins(),
} ) )( PluginArea );
