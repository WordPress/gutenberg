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
 * Reads the preset slug out of a duotone style value.
 *
 * Two presets can hold the same pair of colors, so the slug is the only thing
 * that identifies which one is applied. The colors alone do not.
 *
 * Lives here rather than beside its siblings in `hooks/duotone` because that
 * module imports the filters panel, so the panel cannot import back from it.
 *
 * @param {string|string[]|undefined} duotone A duotone style value.
 *
 * @return {string|undefined} The preset slug, if the value references one.
 */
export function getDuotoneSlugFromPreset( duotone ) {
	if ( typeof duotone !== 'string' ) {
		return undefined;
	}

	const [ , slug ] = duotone.match( /^var:preset\|duotone\|(.+)$/ ) ?? [];

	return slug;
}
