/**
 * Root-level Global Styles (the top-level `styles.*`, not nested under a
 * block) are emitted onto the root/layout selector. Whether they reach a
 * descendant block depends on the CSS property:
 *
 * - Cascading properties (typography, text color) inherit down the DOM, so a
 *   root value genuinely applies to the block and should be surfaced.
 * - Non-cascading properties (background, border, spacing, filters) paint the
 *   root element only. A root value does not reach a descendant block, so
 *   surfacing it as the block's "inherited" value would be misleading.
 *
 * These helpers let non-cascading panels drop root-sourced values while
 * keeping block- and variation-sourced ones.
 */

/**
 * Whether the winning Global Styles layer for a leaf is the root layer.
 *
 * @param {Object} sources Source map keyed by dot-path (from `buildInheritedValue`).
 * @param {string} pathKey Dot-path of the leaf (e.g. `color.background`).
 * @return {boolean} True when the leaf's winning layer is `root`.
 */
export function isRootSourced( sources, pathKey ) {
	return sources?.[ pathKey ]?.layer === 'root';
}

/**
 * Recursively strips root-sourced leaves from an inherited value, keeping
 * block- and variation-sourced ones. Handles shorthand strings, arrays, and
 * nested objects (e.g. split border sides). Returns `undefined` when nothing
 * survives.
 *
 * @param {Object|string|Array|undefined} value    Inherited value at `basePath`.
 * @param {Object}                        sources  Source map keyed by dot-path.
 * @param {string}                        basePath Dot-path of `value` (e.g. `border`).
 * @return {Object|string|Array|undefined} Filtered value, or `undefined` if all leaves were root-sourced.
 */
export function dropRootSourced( value, sources, basePath ) {
	if ( value === undefined || value === null || value === '' ) {
		return value;
	}
	// Leaf (string, number, or array such as a duotone palette): keep unless
	// the winning layer is root.
	if ( typeof value !== 'object' || Array.isArray( value ) ) {
		return isRootSourced( sources, basePath ) ? undefined : value;
	}
	// Object: recurse per key so nested sides/leaves are filtered individually.
	const filtered = {};
	let kept = false;
	for ( const key of Object.keys( value ) ) {
		const next = dropRootSourced(
			value[ key ],
			sources,
			basePath ? `${ basePath }.${ key }` : key
		);
		if ( next !== undefined ) {
			filtered[ key ] = next;
			kept = true;
		}
	}
	return kept ? filtered : undefined;
}
