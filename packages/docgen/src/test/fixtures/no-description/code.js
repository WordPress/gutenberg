// It intentionally doesn't have description for function f
// to test that it doesn't show `Undocumented declaration`.

/**
 * @param {number} x dummy number
 * @return {number} The relay of the value, x.
 */
export const f = function( x ) {
	return x;
};
