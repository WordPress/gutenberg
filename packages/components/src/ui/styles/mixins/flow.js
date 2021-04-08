/** @typedef {number | string} FlowValue */

/**
 * Combines CSS values. Useful for complex shorthand values,
 * functions (e.g. calc()), and mixed string/JS values.
 *
 * @example
 * ```
 * const boxShadow = flow(
 * 	'0 1px',
 * 	get('boxShadowSpreadValue'),
 * 	'2px',
 * 	get('boxShadowColor')
 * )
 * ```
 *
 * ##### Combining groups
 *
 * Groups (Array<string>) can be passed into `flow()`, which are combined and
 * comma separated. Useful for compounded CSS values (e.g. `box-shadow`).
 *
 * @example
 * ```
 * const boxShadow = flow([
 * 		'0 1px',
 * 		get('boxShadowSpreadValue'),
 * 		'2px',
 * 		get('boxShadowColor')
 * 	], [
 * 		'0 10px',
 * 		get('boxShadowSpreadValue'),
 * 		'20px',
 * 		get('boxShadowColor')
 * 	]
 * )
 * ```
 *
 * @param {(FlowValue | FlowValue[])[]} args CSS values to combine.
 * @return {string} The combined CSS string value.
 */
export function flow( ...args ) {
	/** @type {FlowValue[]} */
	const results = [];

	for ( const arg of args ) {
		if ( typeof arg === 'number' || typeof arg === 'string' ) {
			results.push( arg );
		}
		if ( Array.isArray( arg ) ) {
			results.push( flow( ...arg ), ',' );
		}
	}

	return results.join( ' ' ).trim().replace( /,$/, '' );
}
