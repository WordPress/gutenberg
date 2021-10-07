/**
 * Constants
 */
export const PC_WIDTH_DEFAULT = 50;
export const PX_WIDTH_DEFAULT = 350;
export const MIN_WIDTH = 220;
export const MIN_WIDTH_UNIT = 'px';

/**
 * Returns a boolean whether passed unit is percentage
 *
 * @param {string} unit Block width unit.
 *
 * @return {boolean} 	Whether unit is '%'.
 */
export function isPercentageUnit( unit ) {
	return unit === '%';
}
