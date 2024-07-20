/**
 * WordPress dependencies
 */
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import patternOverrides from './pattern-overrides';
import postMeta from './post-meta';
import { unlock } from '../lock-unlock';

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
	const { registerBlockBindingsSource } = unlock( blocksPrivateApis );
	registerBlockBindingsSource( patternOverrides );
	registerBlockBindingsSource( postMeta );
}
