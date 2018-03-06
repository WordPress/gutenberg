/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import { createContext, Component } from '@wordpress/element';

/* External dependencies */
import { isFunction, map, noop } from 'lodash';

/* Internal dependencies */
// import store from '../store';
// import { setGeneralSidebarActivePanel, openGeneralSidebar } from '../store/actions';

const plugins = {};

/**
 * Registers a plugin to the editor.
 *
 * @param {Object}   settings        The settings for this plugin.
 * @param {string}   settings.name   The name of the plugin.
 * @param {Function} settings.render The function that renders the plugin.
 *
 * @return {Object} The final plugin settings object.
 */
export function registerPlugin( settings ) {
	settings = applyFilters( 'editPost.registerPlugin', settings, settings.name );

	if ( typeof settings.name !== 'string' ) {
		console.error(
			'Plugin names must be strings.'
		);
		return null;
	}
	if ( ! /^[a-z][a-z0-9-]*$/.test( settings.name ) ) {
		console.error(
			'Plugin names must include only lowercase alphanumeric characters or dashes, and start with a letter. Example: "my-plugin".'
		);
		return null;
	}
	if ( plugins[ settings.name ] ) {
		console.error(
			`Plugin "${ settings.name }" is already registered.`
		);
	}
	if ( ! settings || ! isFunction( settings.render ) ) {
		console.error(
			'The "render" property must be specified and must be a valid function.'
		);
		return null;
	}

	plugins.context = createContext();

	return plugins[ settings.name ] = settings;
}

class ContextProvider extends Component {
	getChildContext() {
		return {
			plugin: this.props.plugin,
		};
	}

	render() {
		return this.props.children;
	}
}

ContextProvider.childContextTypes = {
	plugin: noop,
};

class Plugins extends Component {
	render() {
		return (
			<div id="plugin-fills" style={ { display: 'none' } }>
				{ map( plugins, plugin => {
					const Context = plugin.context;
					return (
						<Context.Provider key={ plugin.name } value={ plugin.name }>
							{ plugin.render() }
						</Context.Provider>
					);
					// return (
					// 	<ContextProvider key={ plugin.name } plugin={ plugin }>
					// 		{ plugin.render() }
					// 	</ContextProvider>
					// );
				} ) }
			</div>
		);
	}
}

export { Plugins };
