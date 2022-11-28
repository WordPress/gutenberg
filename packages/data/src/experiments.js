/**
 * WordPress dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/experiments';

export const { lock, unlock } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.',
		'@wordpress/data'
	);

export function registerPrivateSelectors( store, selectors ) {
	lock( store, { selectors } );
}

export function registerPrivateActions( store, actions ) {
	lock( store, { actions } );
}

export function privateOf( selectorsOrActions ) {
	return unlock( selectorsOrActions );
}

export const experiments = {};
lock( experiments, {
	registerPrivateSelectors,
	registerPrivateActions,
	privateOf,
} );
