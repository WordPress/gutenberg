/**
 * Normalizes the 'key' property of a KeyboardEvent in IE/Edge
 *
 * Source:
 * https://github.com/downshift-js/downshift/blob/a71005bd879d05d7dcb892d1e0dc5c6ca74e9d39/src/utils.js#L279
 *
 * @param {import('react').KeyboardEvent} event A keyboardEvent object
 *
 * @return {string} The keyboard key
 */
export function normalizeArrowKey( event ) {
	const { key, keyCode } = event;
	/* istanbul ignore next (ie) */
	if ( keyCode >= 37 && keyCode <= 40 && key.indexOf( 'Arrow' ) !== 0 ) {
		return `Arrow${ key }`;
	}
	return key;
}
