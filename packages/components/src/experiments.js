/**
 * WordPress dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/experiments';

/**
 * Internal dependencies
 */
import { default as CustomSelectControl } from './custom-select-control';
import { positionToPlacement as __experimentalPopoverLegacyPositionToPlacement } from './popover/utils';

export const { lock, unlock } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.',
		'@wordpress/components'
	);

export const experiments = {};
lock( experiments, {
	CustomSelectControl,
	__experimentalPopoverLegacyPositionToPlacement,
} );
