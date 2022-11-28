/**
 * WordPress dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/experiments';

export const { register, unlock } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.',
		'@wordpress/block-library'
	);
