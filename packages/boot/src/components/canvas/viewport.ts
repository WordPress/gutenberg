const DEFAULT_DEVICE_TYPE = 'Desktop';

/*
 * Lowercase in the URL, PascalCase in the editor store. Duplicated in
 * packages/edit-site/src/components/block-editor/viewport.js, in the editor's
 * preview-dropdown choices, and in the block editor's block-visibility
 * constants. Update all four when adding a viewport type.
 */
const VALID_VIEWPORTS = [ 'desktop', 'tablet', 'mobile' ];

/**
 * Whether a viewport is one an entity can be asked to be edited at.
 *
 * @param viewport Viewport, as written in the URL.
 * @return Whether the editor has a width for it.
 */
export function isValidViewport( viewport?: string ): viewport is string {
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

	const value = viewport.toLowerCase();
	return value.charAt( 0 ).toUpperCase() + value.slice( 1 );
}
