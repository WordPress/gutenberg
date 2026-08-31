/**
 * wordpress/private-apis – the utilities to enable private cross-package
 * exports of private APIs.
 *
 * This "implementation.ts" file is needed for the sake of the unit tests. It
 * exports more than the public API of the package to aid in testing.
 */

/**
 * The list of core modules allowed to opt-in to the private APIs.
 */
const CORE_MODULES_USING_PRIVATE_APIS = [
	'@wordpress/admin-ui',
	'@wordpress/api-fetch',
	'@wordpress/block-directory',
	'@wordpress/block-editor',
	'@wordpress/block-library',
	'@wordpress/blocks',
	'@wordpress/boot',
	'@wordpress/commands',
	'@wordpress/compose',
	'@wordpress/connectors',
	'@wordpress/workflows',
	'@wordpress/components',
	'@wordpress/core-commands',
	'@wordpress/core-data',
	'@wordpress/customize-widgets',
	'@wordpress/data',
	'@wordpress/edit-post',
	'@wordpress/edit-site',
	'@wordpress/edit-widgets',
	'@wordpress/editor',
	'@wordpress/font-list-route',
	'@wordpress/format-library',
	'@wordpress/patterns',
	'@wordpress/preferences',
	'@wordpress/rich-text',
	'@wordpress/route',
	'@wordpress/router',
	'@wordpress/routes',
	'@wordpress/storybook',
	'@wordpress/sync',
	'@wordpress/theme',
	'@wordpress/fields',
	'@wordpress/lazy-editor',
	'@wordpress/media-editor',
	'@wordpress/media-utils',
	'@wordpress/upload-media',
	'@wordpress/global-styles-engine',
	'@wordpress/global-styles-ui',
	'@wordpress/ui',
	'@wordpress/views',
	'@wordpress/widget-dashboard',
];

/**
 * Core modules that no longer use the private APIs but must remain allowed
 * to opt-in: copies of them published to npm before they stopped using the
 * private APIs call the opt-in at module load, so a plugin bundling one of
 * those copies would throw at load time if the module was not allowed.
 *
 * Opting in as one of these modules still works, but logs a deprecation
 * warning when `SCRIPT_DEBUG` is enabled. Each entry documents the WordPress
 * version scheduled for its removal; a unit test starts failing when the
 * release cycle of that version begins.
 */
const DEPRECATED_CORE_MODULES: Record<
	string,
	{ since: string; removal: string; note: string }
> = {
	'@wordpress/dataviews': {
		since: '7.2',
		removal: '7.4',
		note: 'Update the `@wordpress/dataviews` npm dependency to version 18.1 or newer, which no longer uses the private APIs.',
	},
};

/**
 * The deprecated modules that already logged a warning, to avoid logging
 * the same warning more than once.
 */
const warnedDeprecatedModules = new Set< string >();

/**
 * Logs a deprecation warning for a module in `DEPRECATED_CORE_MODULES`,
 * once per module and only when `SCRIPT_DEBUG` is enabled.
 *
 * @param moduleName The name of the deprecated module that opted in.
 */
function warnDeprecatedModule( moduleName: string ) {
	// eslint-disable-next-line @wordpress/wp-global-usage
	if ( globalThis.SCRIPT_DEBUG !== true ) {
		return;
	}
	if ( warnedDeprecatedModules.has( moduleName ) ) {
		return;
	}
	warnedDeprecatedModules.add( moduleName );
	const { since, removal, note } = DEPRECATED_CORE_MODULES[ moduleName ];
	// eslint-disable-next-line no-console
	console.warn(
		`The private APIs opt-in of the module "${ moduleName }" is deprecated since WordPress ${ since } ` +
			`and will stop working in WordPress ${ removal }. ${ note }`
	);
}

/*
 * Warning for theme and plugin developers.
 *
 * The use of private developer APIs is intended for use by WordPress Core
 * and the Gutenberg plugin exclusively.
 *
 * Dangerously opting in to using these APIs is NOT RECOMMENDED. Furthermore,
 * the WordPress Core philosophy to strive to maintain backward compatibility
 * for third-party developers DOES NOT APPLY to private APIs.
 *
 * THE CONSENT STRING FOR OPTING IN TO THESE APIS MAY CHANGE AT ANY TIME AND
 * WITHOUT NOTICE. THIS CHANGE WILL BREAK EXISTING THIRD-PARTY CODE. SUCH A
 * CHANGE MAY OCCUR IN EITHER A MAJOR OR MINOR RELEASE.
 */
const requiredConsent =
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.';

/**
 * Called by a @wordpress package wishing to opt-in to accessing or exposing
 * private private APIs.
 *
 * @param consent    The consent string.
 * @param moduleName The name of the module that is opting in.
 * @return An object containing the lock and unlock functions.
 */
export const __dangerousOptInToUnstableAPIsOnlyForCoreModules = (
	consent: string,
	moduleName: string
) => {
	if (
		! CORE_MODULES_USING_PRIVATE_APIS.includes( moduleName ) &&
		! ( moduleName in DEPRECATED_CORE_MODULES )
	) {
		throw new Error(
			`You tried to opt-in to unstable APIs as module "${ moduleName }". ` +
				'This feature is only for JavaScript modules shipped with WordPress core. ' +
				'Please do not use it in plugins and themes as the unstable APIs will be removed ' +
				'without a warning. If you ignore this error and depend on unstable features, ' +
				'your product will inevitably break on one of the next WordPress releases.'
		);
	}
	if ( consent !== requiredConsent ) {
		throw new Error(
			`You tried to opt-in to unstable APIs without confirming you know the consequences. ` +
				'This feature is only for JavaScript modules shipped with WordPress core. ' +
				'Please do not use it in plugins and themes as the unstable APIs will removed ' +
				'without a warning. If you ignore this error and depend on unstable features, ' +
				'your product will inevitably break on the next WordPress release.'
		);
	}

	if ( moduleName in DEPRECATED_CORE_MODULES ) {
		warnDeprecatedModule( moduleName );
	}

	return {
		lock,
		unlock,
	};
};

/**
 * Binds private data to an object.
 * It does not alter the passed object in any way, only
 * registers it in an internal map of private data.
 *
 * The private data can't be accessed by any other means
 * than the `unlock` function.
 *
 * @example
 * ```js
 * const object = {};
 * const privateData = { a: 1 };
 * lock( object, privateData );
 *
 * object
 * // {}
 *
 * unlock( object );
 * // { a: 1 }
 * ```
 *
 * @param object      The object to bind the private data to.
 * @param privateData The private data to bind to the object.
 */
function lock( object: unknown, privateData: unknown ) {
	if ( ! object ) {
		throw new Error( 'Cannot lock an undefined object.' );
	}
	const _object = object as Record< symbol, WeakKey >;

	if ( ! ( __private in _object ) ) {
		_object[ __private ] = {};
	}
	lockedData.set( _object[ __private ], privateData );
}

/**
 * Unlocks the private data bound to an object.
 *
 * It does not alter the passed object in any way, only
 * returns the private data paired with it using the `lock()`
 * function.
 *
 * @example
 * ```js
 * const object = {};
 * const privateData = { a: 1 };
 * lock( object, privateData );
 *
 * object
 * // {}
 *
 * unlock( object );
 * // { a: 1 }
 * ```
 *
 * @param object The object to unlock the private data from.
 * @return The private data bound to the object.
 */
function unlock< T = any >( object: unknown ): T {
	if ( ! object ) {
		throw new Error( 'Cannot unlock an undefined object.' );
	}
	const _object = object as Record< symbol, WeakKey >;

	if ( ! ( __private in _object ) ) {
		throw new Error(
			'Cannot unlock an object that was not locked before. '
		);
	}

	return lockedData.get( _object[ __private ] );
}

const lockedData = new WeakMap();

/**
 * Used by lock() and unlock() to uniquely identify the private data
 * related to a containing object.
 */
const __private = Symbol( 'Private API ID' );

// Unit tests utilities:

/**
 * Private function to allow the unit tests to allow
 * a mock module to access the private APIs.
 *
 * @param name The name of the module.
 */
export function allowCoreModule( name: string ) {
	CORE_MODULES_USING_PRIVATE_APIS.push( name );
}

/**
 * Private function to allow the unit tests to set
 * a custom list of allowed modules.
 */
export function resetAllowedCoreModules() {
	while ( CORE_MODULES_USING_PRIVATE_APIS.length ) {
		CORE_MODULES_USING_PRIVATE_APIS.pop();
	}
}

/**
 * Private function to allow the unit tests to trigger
 * the deprecation warnings again.
 */
export function resetWarnedDeprecatedModules() {
	warnedDeprecatedModules.clear();
}

export { DEPRECATED_CORE_MODULES };
