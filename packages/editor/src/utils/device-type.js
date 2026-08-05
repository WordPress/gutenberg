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
const DEVICE_PREVIEW_WIDTH_OFFSET = 1;

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
 * Gets the canvas width for a device preview. The preview is inset from its
 * breakpoint to avoid browser zoom rounding the iframe viewport outside the
 * intended media query.
 *
 * @param {string} deviceType       The device type.
 * @param {Object} viewportSettings Optional viewport breakpoint settings.
 * @return {number|undefined} The device preview width in pixels.
 */
export function getDevicePreviewWidthByDeviceType(
	deviceType,
	viewportSettings
) {
	const width = getCanvasWidthByDeviceType( deviceType, viewportSettings );

	if ( width === undefined ) {
		return undefined;
	}

	let lowerBreakpoint = 0;
	if ( deviceType === TABLET_DEVICE_TYPE ) {
		lowerBreakpoint =
			getCanvasWidthByDeviceType(
				MOBILE_DEVICE_TYPE,
				viewportSettings
			) ?? 0;
	}
	const offset = Math.min(
		DEVICE_PREVIEW_WIDTH_OFFSET,
		( width - lowerBreakpoint ) / 2
	);

	return width - offset;
}
