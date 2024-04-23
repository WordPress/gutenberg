/**
 * WordPress dependencies
 */

/**
 * @type {import('../types').APIFetchMiddleware}
 */
const userLocaleMiddleware = ( options, next ) => {
	return next( options );
};

export default userLocaleMiddleware;
