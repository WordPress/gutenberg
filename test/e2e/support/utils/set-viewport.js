/**
 * Internal dependencies
 */
import { waitForPageDimensions } from './wait-for-page-dimensions';

/**
 * Sets browser viewport to specified type.
 *
 * @param {string} type String to represent dimensions type; can be either small or large.
 */
export async function setViewport( type ) {
	const allowedDimensions = {
		large: { width: 960, height: 700 },
		small: { width: 600, height: 700 },
	};
	const currentDimension = allowedDimensions[ type ];
	await page.setViewport( currentDimension );
	await waitForPageDimensions( currentDimension.width, currentDimension.height );
}
