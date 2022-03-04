/**
 * Internal dependencies
 */
import { Context, ContextualField, RenderedText, OmitNevers } from './helpers';

import { BaseEntityTypes as _BaseEntityTypes } from './base-entity-types';

declare module './base-entity-types' {
	export namespace BaseEntityTypes {
		export interface Plugin< C extends Context > {
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
			plugin_uri: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * The plugin author.
			 */
			author: ContextualField<
				Record< string, string >,
				'view' | 'edit',
				C
			>;
			/**
			 * Plugin author's website address.
			 */
			author_uri: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * The plugin description.
			 */
			description: ContextualField<
				RenderedText< 'edit' >,
				'view' | 'edit',
				C
			>;
			/**
			 * The plugin version number.
			 */
			version: ContextualField< string, 'view' | 'edit', C >;
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
			textdomain: ContextualField< string, 'view' | 'edit', C >;
		}
	}
}

export type PluginStatus = 'active' | 'inactive';
export type Plugin< C extends Context > = OmitNevers<
	_BaseEntityTypes.Plugin< C >
>;
