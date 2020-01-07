export default class PluginManager {
	/**
	 * Create a PluginManager
	 */
	constructor() {
		this.plugins = {};
	}

	/**
	 * Adds a new plugin.
	 *
	 * @param {string} name Plugin name.
	 * @param {Object} settings The settings for this plugin.
	 */
	addPlugin( name, settings ) {
		this.plugins[ name ] = {
			name,
			...settings,
		};
	}

	/**
	 * Removes a plugin
	 *
	 * @param {string} name Plugin name.
	 */
	removePlugin( name ) {
		delete this.plugins[ name ];
	}

	/**
	 * Return settings for a single plugin.
	 *
	 * @param {string} name Plugin name.
	 *
	 * @return {Object} The plugin settings
	 */
	getPlugin( name ) {
		return this.plugins[ name ];
	}

	/**
	 * Returns settings for all registered plugins
	 *
	 * @return {Array} All registered plugin settings.
	 */
	getPlugins() {
		return this.plugins;
	}
}
