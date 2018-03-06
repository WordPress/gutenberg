/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import { Component } from '@wordpress/element';

/* External dependencies */
import { isFunction, map } from 'lodash';
import PropTypes from 'prop-types';

/* Internal dependencies */
import store from '../store';
import {
	openGeneralSidebar,
} from '../store/actions';

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

	return plugins[ settings.name ] = settings;
}

class ContextProvider extends Component {
	getChildContext() {
		return {
			namespace: this.props.namespace,
		};
	}

	render() {
		return this.props.children;
	}
}

ContextProvider.childContextTypes = {
	namespace: PropTypes.string.isRequired,
};

class Plugins extends Component {
	render() {
		return (
			<div id="plugin-fills" style={ { display: 'none' } }>
				{ map( plugins, plugin => {
					return (
						<ContextProvider key={ plugin.name } namespace={ plugin.name }>
							{ plugin.render() }
						</ContextProvider>
					);
				} ) }
			</div>
		);
	}
}

/**
 * Activates the given sidebar.
 *
 * @param  {string} name The name of the sidebar to activate.
 * @return {void}
 */
export function activateSidebar( name ) {
	store.dispatch( openGeneralSidebar( 'plugin', name ) );
}

export { Plugins };
