export const DEFAULT_DEVICE_TYPE = 'Desktop';

// Lowercase in the URL, PascalCase in the editor store. Duplicated from
// block-editor block-visibility constants and editor preview-dropdown choices.
// See those files when adding new viewport types.
const VALID_VIEWPORTS = [ 'desktop', 'tablet', 'mobile' ];

/**
 * Whether a viewport is one an entity can be asked to be edited at.
 *
 * @param {string} [viewport] Viewport, as written in the URL.
 * @return {boolean} Whether the editor has a width for it.
 */
export function isValidViewport( viewport ) {
	return !! viewport && VALID_VIEWPORTS.includes( viewport.toLowerCase() );
}

/**
 * The device type a `viewport` query param names.
 *
 * @param {string} [viewport] Viewport, as written in the URL.
 * @return {string} Device type, Desktop for a viewport the editor has no width for.
 */
export function getDeviceType( viewport ) {
	if ( ! isValidViewport( viewport ) ) {
		return DEFAULT_DEVICE_TYPE;
	}

	const value = viewport.toLowerCase();
	return value.charAt( 0 ).toUpperCase() + value.slice( 1 );
}
