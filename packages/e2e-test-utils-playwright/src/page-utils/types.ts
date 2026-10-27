/**
 * Named viewport options.
 */
export type DimensionsName = 'large' | 'medium' | 'small';

/**
 * Viewport dimensions object.
 */
export type ViewportDimensions = {
	/**
	 * Width, in pixels.
	 */
	width: number;
	/**
	 * Height, in pixels.
	 */
	height: number;
};

/**
 * Valid argument type from which to derive viewport dimensions.
 */
export type Viewport = DimensionsName | ViewportDimensions;
