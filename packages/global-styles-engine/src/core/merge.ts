/**
 * External dependencies
 */
import deepmerge from 'deepmerge';
// @ts-ignore - is-plain-object doesn't have proper types
import { isPlainObject } from 'is-plain-object';

/**
 * Internal dependencies
 */
import type { GlobalStylesConfig } from '../types';

/**
 * Merges base and user global styles configurations
 *
 * @param base Base global styles (theme + WordPress defaults)
 * @param user User customizations
 * @return Merged global styles configuration
 */
export function mergeGlobalStyles(
	base: GlobalStylesConfig,
	user: GlobalStylesConfig
): GlobalStylesConfig {
	return deepmerge( base, user, {
		/*
		 * We only pass as arrays the presets,
		 * in which case we want the new array of values
		 * to override the old array (no merging).
		 */
		isMergeableObject: isPlainObject,
		/*
		 * Exceptions to the above rule.
		 * Background images should be replaced, not merged,
		 * as they themselves are specific object definitions for the style.
		 */
		customMerge: ( key ) => {
			if ( key === 'backgroundImage' ) {
				return ( baseConfig, userConfig ) => userConfig ?? baseConfig;
			}
			return undefined;
		},
	} );
}
