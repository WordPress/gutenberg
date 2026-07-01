/**
 * Internal dependencies
 */
import { DEVICE_TYPES } from '../store/constants';

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
 * @param {number} canvasWidth The canvas width in pixels.
 * @return {string} The device type.
 */
export function getDeviceTypeByCanvasWidth( canvasWidth ) {
	// Mobile
	if ( canvasWidth && canvasWidth <= DEVICE_TYPES.Mobile.canvasWidth ) {
		return DEVICE_TYPES.Mobile.value;
	}
	// Tablet
	if ( canvasWidth && canvasWidth <= DEVICE_TYPES.Tablet.canvasWidth ) {
		return DEVICE_TYPES.Tablet.value;
	}
	// Desktop
	return DEVICE_TYPES.Desktop.value;
}

/**
 * Get the canvas width by device type.
 *
 * @param {string} deviceType The device type.
 * @return {number|undefined} The canvas width in pixels.
 */
export function getCanvasWidthByDeviceType( deviceType ) {
	return DEVICE_TYPES[ deviceType ]?.canvasWidth;
}
