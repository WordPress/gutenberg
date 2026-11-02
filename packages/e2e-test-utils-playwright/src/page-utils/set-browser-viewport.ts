import type { PageUtils } from './';
import type { DimensionsName, Viewport, ViewportDimensions } from './types';

/**
 * Predefined viewport dimensions to reference by name.
 */
const PREDEFINED_DIMENSIONS: Record< DimensionsName, ViewportDimensions > = {
	large: { width: 960, height: 700 },
	medium: { width: 768, height: 700 },
	small: { width: 600, height: 700 },
};

/**
 * Sets browser viewport to specified type.
 *
 * @param this     - The page utilities instance.
 * @param viewport - Viewport name or dimensions object to assign.
 */
export async function setBrowserViewport(
	this: PageUtils,
	viewport: Viewport
) {
	const dimensions =
		typeof viewport === 'string'
			? PREDEFINED_DIMENSIONS[ viewport ]
			: viewport;

	await this.page.setViewportSize( dimensions );
}
