/**
 * Internal dependencies
 */
import { scopeSelector } from './utils';
import { getValueFromObjectPath } from '../../utils/object';

/**
 * Determine the CSS selector for the block type and target provided, returning
 * it if available.
 *
 * @param {import('@wordpress/blocks').Block} blockType        The block's type.
 * @param {string|string[]}                   target           The desired selector's target e.g. `root`, delimited string, or array path.
 * @param {Object}                            options          Options object.
 * @param {boolean}                           options.fallback Whether or not to fallback to broader selector.
 *
 * @return {?string} The CSS selector or `null` if no selector available.
 */
export function getBlockCSSSelector(
	blockType,
	target = 'root',
	options = {}
) {
	if ( ! target ) {
		return null;
	}

	const { fallback = false } = options;
	const { name, selectors, supports } = blockType;

	const hasSelectors = selectors && Object.keys( selectors ).length > 0;
	const path = Array.isArray( target ) ? target.join( '.' ) : target;

	// Root selector.

	// Calculated before returning as it can be used as a fallback for feature
	// selectors later on.
	let rootSelector = null;

	if ( hasSelectors && selectors.root ) {
		// Use the selectors API if available.
		rootSelector = selectors?.root;
	} else if ( supports?.__experimentalSelector ) {
		// Use the old experimental selector supports property if set.
		rootSelector = supports.__experimentalSelector;
	} else {
		// If no root selector found, generate default block class selector.
		rootSelector =
			'.wp-block-' + name.replace( 'core/', '' ).replace( '/', '-' );
	}

	// Return selector if it's the root target we are looking for.
	if ( path === 'root' ) {
		return rootSelector;
	}

	// If target is not `root` or `duotone` we have a feature or subfeature
	// as the target. If the target is a string convert to an array.
	const pathArray = Array.isArray( target ) ? target : target.split( '.' );

	// Feature selectors ( may fallback to root selector );
	if ( pathArray.length === 1 ) {
		const fallbackSelector = fallback ? rootSelector : null;

		// Prefer the selectors API if available.
		if ( hasSelectors ) {
			// Get selector from either `feature.root` or shorthand path.
			const featureSelector =
				getValueFromObjectPath( selectors, `${ path }.root`, null ) ||
				getValueFromObjectPath( selectors, path, null );

			// Return feature selector if found or any available fallback.
			return featureSelector || fallbackSelector;
		}

		// Try getting old experimental supports selector value.
		const featureSelector = getValueFromObjectPath(
			supports,
			`${ path }.__experimentalSelector`,
			null
		);

		// If nothing to work with, provide fallback selector if available.
		if ( ! featureSelector ) {
			return fallbackSelector;
		}

		// Scope the feature selector by the block's root selector.
		return scopeSelector( rootSelector, featureSelector );
	}

	// Subfeature selector.
	// This may fallback either to parent feature or root selector.
	let subfeatureSelector;

	// Use selectors API if available.
	if ( hasSelectors ) {
		subfeatureSelector = getValueFromObjectPath( selectors, path, null );
	}

	// Only return if we have a subfeature selector.
	if ( subfeatureSelector ) {
		return subfeatureSelector;
	}

	// To this point we don't have a subfeature selector. If a fallback has been
	// requested, remove subfeature from target path and return results of a
	// call for the parent feature's selector.
	if ( fallback ) {
		return getBlockCSSSelector( blockType, pathArray[ 0 ], options );
	}

	// We tried.
	return null;
}
