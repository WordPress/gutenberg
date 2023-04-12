/**
 * WordPress dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

/**
 * Internal dependencies
 */
import { default as useCommand } from './hooks/use-command';
import { default as useCommandLoader } from './hooks/use-command-loader';

export const { lock, unlock } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.',
		'@wordpress/commands'
	);

export const privateApis = {};
lock( privateApis, {
	useCommand,
	useCommandLoader,
} );
