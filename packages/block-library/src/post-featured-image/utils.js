/**
 * Generates the opacity/dim class based on given number.
 *
 * @param {number} ratio Dim/opacity number.
 *
 * @return {string} Generated class.
 */
export function dimRatioToClass( ratio ) {
	return ratio === undefined
		? null
		: 'has-background-dim-' + 10 * Math.round( ratio / 10 );
}
