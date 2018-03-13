/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import { Component } from '@wordpress/element';

/* External dependencies */
import { isFunction, map } from 'lodash';

/**
 * Internal dependencies
 */
import { PluginContextProvider, withPluginContext } from './components/context';

const plugins = {};
const pluginUIComponents = {};

/**
 * Registers a plugin to the editor.
 *
 * @param {Object}   settings        The settings for this plugin.
 * @param {string}   settings.name   The name of the plugin.
 * @param {Function} settings.render The function that renders the plugin.
 *
 * @return {Object} The final plugin settings object.
 */
function registerPlugin( settings ) {
	if ( typeof settings !== 'object' ) {
		console.error(
			'No settings object provided!'
		);
		return null;
	}
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
	if ( ! isFunction( settings.render ) ) {
		console.error(
			'The "render" property must be specified and must be a valid function.'
		);
		return null;
	}

	settings.sidebar = {};

	settings = applyFilters( 'editPost.registerPlugin', settings, settings.name );

	return plugins[ settings.name ] = settings;
}

/**
 * A callback called by the UI components via context to register the UI component.
 *
 * @param {string} pluginName       The plugin name.
 * @param {string} uiNamespacedName The unique ui plugin identifier.
 * @param {string} uiType           The UI type.
 */
function registerUIComponent( pluginName, uiNamespacedName, uiType ) {
	pluginUIComponents[ uiNamespacedName ] = {
		pluginName,
		uiType,
	};
}

/**
 * Get the registered plugin information, null if it doesn't exist.
 *
 * @param {string}  uiNamespacedName The unique ui plugin identifier.
 * @param {string?} uiType           Optional UI type, will only return if ui type matches.
 *
 * @return {Object|null} Object containing plugin information null if the plugin doesn't exist.
 */
function getRegisteredUIComponent( uiNamespacedName, uiType = null ) {
	const uiComponent = pluginUIComponents[ uiNamespacedName ] || null;
	if ( uiType ) {
		if ( uiComponent && uiComponent.uiType === uiType ) {
			return uiComponent;
		}
		return null;
	}
	return uiComponent;
}

/**
 * A component that renders all plugin fills in a hidden div.
 */
class PluginArea extends Component {
	render() {
		return (
			<div id="plugin-fills" style={ { display: 'none' } }>
				{ map( plugins, plugin => {
					const boundRegisterUIComponent = registerUIComponent.bind( null, plugin.name );
					return (
						<PluginContextProvider key={ plugin.name } value={ {
							registerUIComponent: boundRegisterUIComponent,
							namespace: plugin.name,
						} }>
							{ plugin.render() }
						</PluginContextProvider>
					);
				} ) }
			</div>
		);
	}
}

export {
	PluginArea,
	withPluginContext,
	registerPlugin,
	getRegisteredUIComponent,
};
