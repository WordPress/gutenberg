/**
 * Waits for the small delay until the animation finishes.
 *
 * @param {number} delay Animation Delay.
 *
 * @return {Promise} Promise resolving after a small delay.
 */
export const waitForAnimation = async ( delay = 100 ) => {
	return new Promise( ( resolve ) => setTimeout( resolve, delay ) );
};
