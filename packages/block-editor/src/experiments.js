/**
 * WordPress dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/experiments';

/**
 * Internal dependencies
 */
import * as globalStyles from './components/global-styles';

export const { lock, unlock } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.',
		'@wordpress/block-editor'
	);

/**
 * Experimental @wordpress/block-editor APIs.
 */
export const experiments = {};
lock( experiments, {
	...globalStyles,
} );
