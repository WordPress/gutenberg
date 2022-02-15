/**
 * Internal dependencies
 */
import { RawField, WithEdits } from './common';

export interface Plugin {
	/**
	 * The plugin file.
	 */
	plugin: string;
	/**
	 * The plugin activation status.
	 */
	status: PluginStatus;
	/**
	 * The plugin name.
	 */
	name: string;
	/**
	 * The plugin's website address.
	 */
	plugin_uri?: string;
	/**
	 * The plugin author.
	 */
	author?: {
		[ k: string ]: string;
	};
	/**
	 * Plugin author's website address.
	 */
	author_uri?: string;
	/**
	 * The plugin description.
	 */
	description?: RawField;
	/**
	 * The plugin version number.
	 */
	version?: string;
	/**
	 * Whether the plugin can only be activated network-wide.
	 */
	network_only: boolean;
	/**
	 * Minimum required version of WordPress.
	 */
	requires_wp: string;
	/**
	 * Minimum required version of PHP.
	 */
	requires_php: string;
	/**
	 * The plugin's text domain.
	 */
	textdomain?: string;
}

export type PluginStatus = 'active' | 'inactive';
export interface PluginWithEdits extends WithEdits< Plugin, 'description' > {}
