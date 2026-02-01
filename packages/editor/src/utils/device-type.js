/**
 * Internal dependencies
 */
import { DEVICE_TYPES } from '../store/constants';

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
 * @return {number} The canvas width in pixels.
 */
export function getCanvasWidthByDeviceType( deviceType ) {
	return DEVICE_TYPES[ deviceType ]?.canvasWidth ?? undefined;
}

/**
 * Gets the device type whose canvas width matches the given width, if any.
 *
 * @param {number} canvasWidth The canvas width in pixels.
 * @return {string|undefined} The matching device type, or undefined if none matches.
 */
export function getMatchedDeviceTypeByCanvasWidth( canvasWidth ) {
	if ( ! canvasWidth ) {
		return 'Desktop';
	}
	const matched = Object.values( DEVICE_TYPES ).find(
		( config ) => config.canvasWidth === canvasWidth
	);
	return matched ? matched.value : undefined;
}
