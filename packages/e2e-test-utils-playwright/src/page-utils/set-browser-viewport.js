/**
 * Named viewport options.
 *
 * @typedef {"large"|"medium"|"small"} WPDimensionsName
 */

/**
 * Viewport dimensions object.
 *
 * @typedef {Object} WPViewportDimensions
 *
 * @property {number} width  Width, in pixels.
 * @property {number} height Height, in pixels.
 */

/**
 * Predefined viewport dimensions to reference by name.
 *
 * @enum {WPViewportDimensions}
 *
 * @type {Record<WPDimensionsName, WPViewportDimensions>}
 */
const PREDEFINED_DIMENSIONS = {
	large: { width: 960, height: 700 },
	medium: { width: 768, height: 700 },
	small: { width: 600, height: 700 },
};

/**
 * Valid argument argument type from which to derive viewport dimensions.
 *
 * @typedef {WPDimensionsName|WPViewportDimensions} WPViewport
 */

/**
 * Sets browser viewport to specified type.
 *
 * @this {import('./').PageUtils}
 * @param {WPViewport} viewport Viewport name or dimensions object to assign.
 */
export async function setBrowserViewport( viewport ) {
	const dimensions =
		typeof viewport === 'string'
			? PREDEFINED_DIMENSIONS[ viewport ]
			: viewport;

	await this.page.setViewportSize( dimensions );
}
