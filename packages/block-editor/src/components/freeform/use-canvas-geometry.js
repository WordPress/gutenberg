import { useLayoutEffect, useState } from '@wordpress/element';
import { DESIGN_WIDTH } from './constants';

/**
 * Tracks what the canvas's design space is worth in pixels.
 *
 * Two conversions are needed and they are not the same. The canvas is rendered
 * inside the editor's iframe, so its own box is measured in the iframe's CSS
 * pixels; the pointer, however, reports coordinates in the editor document,
 * which the editor may be scaling (zoom-out mode scales the whole iframe).
 * Comparing the overlay's laid-out width with its rendered width recovers that
 * scale, so a drag tracks the pointer at any zoom.
 *
 * @param {?Element} canvasElement  The canvas block's element, inside the iframe.
 * @param {?Element} overlayElement The overlay covering it, in the editor document.
 * @return {?{designToCanvasPx: number, pointerScale: number}} The conversions,
 *         or null until both elements have been measured.
 */
export function useCanvasGeometry( canvasElement, overlayElement ) {
	const [ geometry, setGeometry ] = useState( null );

	useLayoutEffect( () => {
		if ( ! canvasElement || ! overlayElement ) {
			setGeometry( null );
			return;
		}

		const measure = () => {
			const canvasWidth = canvasElement.offsetWidth;
			const overlayWidth = overlayElement.offsetWidth;
			if ( ! canvasWidth || ! overlayWidth ) {
				return;
			}
			const renderedWidth = overlayElement.getBoundingClientRect().width;
			setGeometry( ( previous ) => {
				const next = {
					designToCanvasPx: canvasWidth / DESIGN_WIDTH,
					pointerScale: renderedWidth / overlayWidth,
				};
				return previous &&
					previous.designToCanvasPx === next.designToCanvasPx &&
					previous.pointerScale === next.pointerScale
					? previous
					: next;
			} );
		};

		measure();
		const observer = new window.ResizeObserver( measure );
		observer.observe( canvasElement );
		observer.observe( overlayElement );
		return () => observer.disconnect();
	}, [ canvasElement, overlayElement ] );

	return geometry;
}

/**
 * Converts pointer travel, in the editor's pixels, into design units.
 *
 * @param {number} pixels   Pointer travel.
 * @param {Object} geometry From `useCanvasGeometry`.
 * @return {number} The same travel in design units.
 */
export function toDesignUnits( pixels, geometry ) {
	const pixelsPerUnit =
		geometry.designToCanvasPx * ( geometry.pointerScale || 1 );
	return pixelsPerUnit ? pixels / pixelsPerUnit : 0;
}

/**
 * Converts a design-space value into the overlay's own pixels, which are the
 * canvas's CSS pixels — the overlay is laid out to cover the canvas exactly.
 *
 * @param {number} units    A design-space value.
 * @param {Object} geometry From `useCanvasGeometry`.
 * @return {number} The value in overlay pixels.
 */
export function toOverlayPx( units, geometry ) {
	return units * geometry.designToCanvasPx;
}
