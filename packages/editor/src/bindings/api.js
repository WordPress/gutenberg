/**
 * WordPress dependencies
 */
import { registerBlockBindingsSource } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import patternOverrides from './pattern-overrides';
import postMeta from './post-meta';

/**
 * Function to register core block bindings sources provided by the editor.
 *
 * @example
 * ```js
 * import { registerCoreBlockBindingsSources } from '@wordpress/editor';
 *
 * registerCoreBlockBindingsSources();
 * ```
 */
export function registerCoreBlockBindingsSources() {
	registerBlockBindingsSource( patternOverrides );
	registerBlockBindingsSource( postMeta );
}
