/**
 * @param {import('react').KeyboardEvent} event
 * @return {string}
 */
export function normalizeArrowKey( event ) {
	const { key, keyCode } = event;
	/* istanbul ignore next (ie) */
	if ( keyCode >= 37 && keyCode <= 40 && key.indexOf( 'Arrow' ) !== 0 ) {
		return `Arrow${ key }`;
	}
	return key;
}
