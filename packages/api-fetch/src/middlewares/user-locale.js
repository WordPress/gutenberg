/**
 * WordPress dependencies
 */

/**
 * @type {import('../types').APIFetchMiddleware}
 */
export const userLocaleMiddleware = ( options, next ) => {
	return next( options );
};
