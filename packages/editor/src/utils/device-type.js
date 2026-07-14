/**
 * WordPress dependencies
 */
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { getViewportBreakpoints, getViewportBreakpointValueInPixels } = unlock(
	globalStylesEnginePrivateApis
);

const VIEWPORT_KEY_BY_DEVICE_TYPE = {
	Tablet: 'tablet',
	Mobile: 'mobile',
};

const DESKTOP_DEVICE_TYPE = 'Desktop';
const TABLET_DEVICE_TYPE = 'Tablet';
const MOBILE_DEVICE_TYPE = 'Mobile';

/**
 * Fixed device preview heights. Used to give the editor canvas a
 * device-shaped frame in mobile and tablet previews. These are display
 * dimensions for the preview frame, not responsive breakpoints.
 */
const DEVICE_HEIGHT_BY_DEVICE_TYPE = {
	[ MOBILE_DEVICE_TYPE ]: 768,
	[ TABLET_DEVICE_TYPE ]: 1024,
};

/**
 * Maps a device preview type to its corresponding viewport style state. Used
 * when Responsive editing is enabled so the device preview drives which
 * viewport block style edits are applied to.
 *
 * @type {Object}
 */
export const VIEWPORT_STATE_BY_DEVICE_TYPE = {
	Desktop: 'default',
	Tablet: '@tablet',
	Mobile: '@mobile',
};

/**
 * Gets the most appropriate device type based on the canvas width.
 *
 * @param {number|string|undefined} canvasWidth      The canvas width.
 * @param {Object}                  viewportSettings Optional viewport breakpoint settings.
 * @return {string} The device type.
 */
export function getDeviceTypeByCanvasWidth( canvasWidth, viewportSettings ) {
	const width = getViewportBreakpointValueInPixels( canvasWidth );

	// Mobile
	if (
		width &&
		width <=
			getViewportBreakpointValueInPixels(
				getCanvasWidthByDeviceType( 'Mobile', viewportSettings )
			)
	) {
		return MOBILE_DEVICE_TYPE;
	}
	// Tablet
	if (
		width &&
		width <=
			getViewportBreakpointValueInPixels(
				getCanvasWidthByDeviceType( 'Tablet', viewportSettings )
			)
	) {
		return TABLET_DEVICE_TYPE;
	}
	// Desktop
	return DESKTOP_DEVICE_TYPE;
}

/**
 * Get the canvas width by device type.
 *
 * @param {string} deviceType       The device type.
 * @param {Object} viewportSettings Optional viewport breakpoint settings.
 * @return {number|undefined} The canvas width in pixels.
 */
export function getCanvasWidthByDeviceType( deviceType, viewportSettings ) {
	const viewportKey = VIEWPORT_KEY_BY_DEVICE_TYPE[ deviceType ];

	if ( viewportKey ) {
		return getViewportBreakpointValueInPixels(
			getViewportBreakpoints( viewportSettings )[ viewportKey ]
		);
	}
}

/**
 * Gets the preview frame height by device type. Returns a fixed pixel
 * height for mobile and tablet so the canvas keeps a device-shaped
 * aspect ratio, and `undefined` for desktop so the frame fills the
 * editor.
 *
 * @param {string} deviceType The device type.
 * @return {number|undefined} The preview height in pixels, or undefined
 *                             when no fixed height applies.
 */
export function getCanvasHeightByDeviceType( deviceType ) {
	return Object.prototype.hasOwnProperty.call(
		DEVICE_HEIGHT_BY_DEVICE_TYPE,
		deviceType
	)
		? DEVICE_HEIGHT_BY_DEVICE_TYPE[ deviceType ]
		: undefined;
}
