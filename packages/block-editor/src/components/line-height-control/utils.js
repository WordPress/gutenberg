export const BASE_DEFAULT_VALUE = 1.5;
export const STEP = 0.01;
/**
 * A spin factor of 10 allows the spin controls to increment/decrement by 0.1.
 * e.g. A line-height value of 1.55 will increment to 1.65.
 */
export const SPIN_FACTOR = 10;
/**
 * There are varying value types within LineHeightControl:
 *
 * {undefined} Initial value. No changes from the user.
 * {string} Input value. Value consumed/outputted by the input. Empty would be ''.
 * {number} Block attribute type. Input value needs to be converted for attribute setting.
 *
 * Note: If the value is undefined, the input requires it to be an empty string ('')
 * in order to be considered "controlled" by props (rather than internal state).
 */
export const RESET_VALUE = '';

/**
 * Determines if the lineHeight attribute has been properly defined.
 *
 * @param {any} lineHeight The value to check.
 *
 * @return {boolean} Whether the lineHeight attribute is valid.
 */
export function isLineHeightDefined( lineHeight ) {
	return lineHeight !== undefined && lineHeight !== RESET_VALUE;
}
