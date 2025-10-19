/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';

export function useToolsPanelDropdownMenuProps() {
	const isMobile = useViewportMatch( 'medium', '<' );
	return ! isMobile
		? {
				popoverProps: {
					placement: 'left-start',
					// For non-mobile, inner sidebar width (248px) - button width (24px) - border (1px) + padding (16px) + spacing (20px)
					offset: 259,
				},
		  }
		: {};
}

/**
 * Function that scopes a selector with another one. This works a bit like
 * SCSS nesting except the `&` operator isn't supported.
 *
 * @example
 * ```js
 * const scope = '.a, .b .c';
 * const selector = '> .x, .y';
 * const merged = scopeSelector( scope, selector );
 * // merged is '.a > .x, .a .y, .b .c > .x, .b .c .y'
 * ```
 *
 * @param {string} scope    Selector to scope to.
 * @param {string} selector Original selector.
 *
 * @return {string} Scoped selector.
 */
export function scopeSelector( scope, selector ) {
	if ( ! scope || ! selector ) {
		return selector;
	}

	const scopes = scope.split( ',' );
	const selectors = selector.split( ',' );

	const selectorsScoped = [];
	scopes.forEach( ( outer ) => {
		selectors.forEach( ( inner ) => {
			selectorsScoped.push( `${ outer.trim() } ${ inner.trim() }` );
		} );
	} );

	return selectorsScoped.join( ', ' );
}

/**
 * Compares global style variations according to their styles and settings properties.
 *
 * @example
 * ```js
 * const globalStyles = { styles: { typography: { fontSize: '10px' } }, settings: {} };
 * const variation = { styles: { typography: { fontSize: '10000px' } }, settings: {} };
 * const isEqual = areGlobalStyleConfigsEqual( globalStyles, variation );
 * // false
 * ```
 *
 * @param {Object} original  A global styles object.
 * @param {Object} variation A global styles object.
 *
 * @return {boolean} Whether `original` and `variation` match.
 */
export function areGlobalStyleConfigsEqual( original, variation ) {
	if ( typeof original !== 'object' || typeof variation !== 'object' ) {
		return original === variation;
	}
	return (
		fastDeepEqual( original?.styles, variation?.styles ) &&
		fastDeepEqual( original?.settings, variation?.settings )
	);
}
