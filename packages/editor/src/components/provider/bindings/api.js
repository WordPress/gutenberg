/**
 * WordPress dependencies
 */
import {
	privateApis as blocksPrivateApis,
	store as blocksStore,
} from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';

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

/**
 * Function to bootstrap core block bindings sources defined in the server.
 *
 * @param {Object} sources Object containing the sources to bootstrap.
 *
 * @example
 * ```js
 * import { bootstrapBlockBindingsSourcesFromServer } from '@wordpress/editor';
 *
 * bootstrapBlockBindingsSourcesFromServer( sources );
 * ```
 */
export function bootstrapBlockBindingsSourcesFromServer( sources ) {
	if ( sources ) {
		const { addBootstrappedBlockBindingsSource } = unlock(
			dispatch( blocksStore )
		);
		for ( const [ name, args ] of Object.entries( sources ) ) {
			addBootstrappedBlockBindingsSource( {
				name,
				...args,
			} );
		}
	}
}
