import { createSlotFill } from '@wordpress/components';

/**
 * Canvas margin for UI beside the content. The canvas reserves space while a
 * fill renders.
 */
export const CanvasMargin = createSlotFill( Symbol( 'EditorCanvasMargin' ) );

export const CANVAS_MARGIN_WIDTH = 280;

// The margin hides below this canvas width.
export const CANVAS_MARGIN_MIN_CANVAS_WIDTH = 880;
