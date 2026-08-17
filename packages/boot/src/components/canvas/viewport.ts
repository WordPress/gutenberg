export const DEFAULT_DEVICE_TYPE = 'Desktop';

// Lowercase in the URL, PascalCase in the editor store.
const VALID_VIEWPORTS = [ 'desktop', 'tablet', 'mobile' ];

/**
 * Whether a viewport is one an entity can be asked to be edited at.
 *
 * @param viewport Viewport, as written in the URL.
 * @return Whether the editor has a width for it.
 */
export function isValidViewport( viewport?: string ) {
	return !! viewport && VALID_VIEWPORTS.includes( viewport.toLowerCase() );
}

/**
 * The device type a `viewport` search param names.
 *
 * @param viewport Viewport, as written in the URL.
 * @return Device type, Desktop for a viewport the editor has no width for.
 */
export function getDeviceType( viewport?: string ) {
	if ( ! isValidViewport( viewport ) ) {
		return DEFAULT_DEVICE_TYPE;
	}

	const value = ( viewport as string ).toLowerCase();
	return value.charAt( 0 ).toUpperCase() + value.slice( 1 );
}
